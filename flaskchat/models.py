from flaskchat import db, login_manager
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


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
