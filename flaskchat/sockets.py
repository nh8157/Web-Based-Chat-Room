import json
from flask_socketio import join_room, leave_room, emit
from flaskchat.models import User, Room
from flaskchat import socketio, db


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
    data = json.loads(data)
    user = User.query.filter_by(username=data['username']).first()
    room = user.room
    msg = {"username": data["username"], "msg": data["msg"]}
    msg = json.dumps(msg)
    emit('send', msg, room=room.id, include_self=True)


@socketio.on('join')
def on_join(data):
    data = json.loads(data)
    user = User.query.filter_by(username=data['username']).first()
    partner = User.query.filter_by(username=data['partner']).first()
    if not partner.room:
        new_room = Room()
        db.session.add(new_room)
        db.session.commit()
        peers = [user.username, partner.username]
        user.room = new_room
        db.session.commit()
        join_room(new_room.id)
        msg = {'username': user.username, 'room': new_room.id, 'peers':peers}
        msg = json.dumps(msg)
        emit('join', msg, broadcast=True)
    else:
        room = partner.room
        peers = User.query.filter_by(room=room).all()
        peers = [i.username for i in peers]
        peers.append(data['username'])
        msg = {'username': user.username, 'room': room.id, 'peers':peers}
        msg = json.dumps(msg)
        join_room(partner.room.id)
        user.room = room
        db.session.commit()
        emit('join', msg, room=room.id)


@socketio.on('leave')
def on_leave(data):
    data = json.loads(data)
    user = User.query.filter_by(username=data['username']).first()
    room = user.room
    msg = {'username': user.username, 'success': True}
    emit('leave', msg, room=room.id, include_self=True)
    leave_room(room.id)
    user.room = None
    db.session.commit()
    msg = json.dumps(msg)
    

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
