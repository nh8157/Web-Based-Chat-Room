from passlib.hash import pbkdf2_sha256
from flask import render_template, url_for, flash, redirect
from flaskchat import app, db
from flaskchat.forms import RegistrationForm, LoginForm
from flaskchat.models import User
from flask_login import login_user, current_user, logout_user, login_required


@app.route("/", methods=['GET', 'POST'])
def index():
    reg_form = RegistrationForm()
    if reg_form.validate_on_submit():
        username = reg_form.username.data
        password = reg_form.password.data
        hashed_pswd = pbkdf2_sha256.hash(password)
        user = User(username=username, hashed_pswd=hashed_pswd)
        db.session.add(user)
        db.session.commit()
        flash('Registered successfully. Please login.', 'success')
        return redirect(url_for('login'))
    return render_template("index.html", form=reg_form)


@app.route("/login", methods=['GET', 'POST'])
def login():
    login_form = LoginForm()
    if login_form.validate_on_submit():
        user_object = User.query.filter_by(username=login_form.username.data).first()
        login_user(user_object)
        user_object.status = 'login'
        db.session.commit()
        return redirect(url_for('chat'))
    return render_template("login.html", form=login_form)


@app.route("/chat", methods=['GET', 'POST'])
@login_required
def chat():
    if not current_user.is_authenticated:
        flash('Please login', 'danger')
        return redirect(url_for('login'))
    return render_template("chat.html", username=current_user.username)


@app.route("/logout", methods=['GET'])
@login_required
def logout():
    logout_user()
    flash('You have logged out successfully', 'success')
    return redirect(url_for('login'))


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404