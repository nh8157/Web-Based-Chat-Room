import time
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, current_user, logout_user, UserMixin, login_required
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import InputRequired, Length, EqualTo, ValidationError
import json

from passlib.hash import pbkdf2_sha256
# from wtform_fields import *

# Configure app
app = Flask(__name__)

app.config['SECRET_KEY'] = 'SECRET'

# Configure database
app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///site.db'
db = SQLAlchemy(app)


class Room(db.Model):
    """  Room model """
    id = db.Column(db.Integer, primary_key=True)
    users = db.relationship('User', backref='room')


class User(UserMixin, db.Model):
    """ User model """

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(25), unique=True, nullable=False)
    hashed_pswd = db.Column(db.String(25), nullable=False)
    status = db.Column(db.String(25), nullable=False, default='logout')
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'))


    def __repr__(self):
        return f'User[{self.username}]'


# Initialize login manager
login_manager = LoginManager(app)
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# configure the forms
def invalid_credentials(form, field):
    """ Username and password checker """

    password = field.data
    username = form.username.data

    # Check username is invalid
    user_data = User.query.filter_by(username=username).first()
    if user_data is None:
        raise ValidationError("Username or password is incorrect")

    # Check password in invalid
    elif not pbkdf2_sha256.verify(password, user_data.hashed_pswd):
        raise ValidationError("Username or password is incorrect")


class RegistrationForm(FlaskForm):
    """ Registration form"""

    username = StringField('username', validators=[InputRequired(message="Username required"), Length(min=4, max=25, message="Username must be between 4 and 25 characters")])
    password = PasswordField('password', validators=[InputRequired(message="Password required"), Length(min=4, max=25, message="Password must be between 4 and 25 characters")])
    confirm_pswd = PasswordField('confirm_pswd', validators=[InputRequired(message="Password required"), EqualTo('password', message="Passwords must match")])

    def validate_username(self, username):
        user_object = User.query.filter_by(username=username.data).first()
        if user_object:
            raise ValidationError("Username already exists. Select a different username.")

class LoginForm(FlaskForm):
    """ Login form """

    username = StringField('username', validators=[InputRequired(message="Username required")])
    password = PasswordField('password', validators=[InputRequired(message="Password required"), invalid_credentials])


socketio = SocketIO(app, manage_session=False)

# programs that matters
@app.route("/", methods=['GET', 'POST'])
def index():
    reg_form = RegistrationForm()
    # Update database if validation success
    if reg_form.validate_on_submit():
        username = reg_form.username.data
        password = reg_form.password.data
        # Hash password
        hashed_pswd = pbkdf2_sha256.hash(password)

        # Add username & hashed password to DB
        user = User(username=username, hashed_pswd=hashed_pswd)
        db.session.add(user)
        db.session.commit()

        flash('Registered successfully. Please login.', 'success')
        return redirect(url_for('login'))

    return render_template("index.html", form=reg_form)


@app.route("/login", methods=['GET', 'POST'])
def login():

    login_form = LoginForm()

    # Allow login if validation success
    if login_form.validate_on_submit():
        user_object = User.query.filter_by(username=login_form.username.data).first()
        login_user(user_object)
        user_object.status = 'login'
        db.session.commit()
        return redirect(url_for('chat'))

    return render_template("login.html", form=login_form)


@app.route("/logout", methods=['GET'])
@login_required
def logout():
    # Logout user
    logout_user()
    flash('You have logged out successfully', 'success')
    return redirect(url_for('login'))


@app.route("/chatlist", methods=['GET'])
@login_required
def chatlist():
    users=User.query.filter_by(status='login').all()
    name_list = [i.username for i in users if i != current_user and i.status == 'login']
    return ' '.join(name_list)

@app.route("/chat", methods=['GET', 'POST'])
@login_required
def chat():

    if not current_user.is_authenticated:
        flash('Please login', 'danger')
        return redirect(url_for('login'))
    return render_template("chat.html", username=current_user.username)


@app.errorhandler(404)
def page_not_found(e):
    # note that we set the 404 status explicitly
    return render_template('404.html'), 404

@socketio.on('users')
def on_users(data):
    data = json.loads(data)
    users = User.query.filter_by(status='login').all()
    peers = [i.username for i in users]
    msg = {"username": data['username'], "peers": peers}
    msg = json.dumps(msg)
    emit('users', msg, broadcast=True)

@socketio.on('send')
def on_send(data):
    """Broadcast messages"""
    data = json.loads(data)
    user = User.query.filter_by(username=data['username']).first()
    room = user.room
    print(room.id)
    msg = {"username": data["username"], "msg": data["msg"]}
    print(msg)
    msg = json.dumps(msg)
    emit('send', msg, room=room.id, include_self=True)


@socketio.on('join')
def on_join(data):
    """User joins a room"""
    data = json.loads(data)
    user = User.query.filter_by(username=data['username']).first()
    partner = User.query.filter_by(username=data['partner']).first()
    print(user, partner)
    # partner isn't in a room, create a new room
    if not partner.room:
        new_room = Room()
        db.session.add(new_room)
        db.session.commit()
        peers = [user.username, partner.username]
        user.room = new_room
        db.session.commit()
        join_room(new_room)
        msg = {'username': user.username, 'room': new_room.id, 'peers':peers}
        msg = json.dumps(msg)
        emit('join', msg, broadcast=True)
    # partner already in a room
    else:
        room = partner.room
        peers = User.query.filter_by(room=room).all()
        peers=[i.username for i in peers]
        peers.append(data['username'])
        msg = {'username': user.username, 'room': room.id, 'peers':peers}
        msg = json.dumps(msg)
        join_room(partner.room)
        user.room = room
        db.session.commit()
        emit('join', msg, room=room)


# @socketio.on('create')
# def on_create(data):
#     """create a new group"""
#     try:
#         data = json.loads(data)
#         room = Room()
#         db.session.add(room)
#         db.session.commit()
#         join_room(room)
#         user = User.query.filter_by(username=data['username']).first()
#         user.room = room
#         db.session.commit()
#         msg = {'username': user.username, 'success': True, 'room': room.id}
#         msg = json.dumps(msg)
#         emit('create', msg)
#     except:
#         msg = {'username': user.username, 'success': False}
#         msg = json.dumps(msg)
#         emit('create', msg)


@socketio.on('leave')
def on_leave(data):
    """User leaves a room"""
    data = json.loads(data)
    user = User.query.filter_by(username=data['username']).first()
    room = user.room
    msg = {'username': user.username, 'success': True}
    emit('leave', msg, room=room, include_self=True)
    leave_room(room)
    user.room = None
    db.session.commit()
    msg = json.dumps(msg)
    print(user.username, "leaving")


@socketio.on('logout')
def on_logout(data):
    data = json.loads(data)
    user = User.query.filter_by(username=data['username']).first()
    msg = {"username": user.username}
    msg = json.dumps(msg)
    emit('logout', msg, broadcast=True)
    user.status = 'logout'
    db.session.commit()
    user.room = None
    db.session.commit()


if __name__ == "__main__":
    socketio.run(app, debug=True)
