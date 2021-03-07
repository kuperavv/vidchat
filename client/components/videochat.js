import { io } from 'socket.io-client';
import React, { Component } from 'react';

const socket = io();

const typeGlobal = 'student';

const config = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    // {
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ],
};

// Media contrains
const constraints = {
  video: { facingMode: 'user' },
  // Uncomment to enable audio
  //audio: true,
};

class Video extends Component {
  constructor(props) {
    super(props);
    this.state = { teacher: {}, students: {} };
  }
  componentDidMount() {
    const video = document.getElementById('self');

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        video.srcObject = stream;
        socket.emit('broadcaster', socket.id, typeGlobal);
      })
      .catch((error) => console.error(error));

    socket.on('broadcaster', (id, type) => {
      const video = document.getElementById('self');
      const peerConnection = new RTCPeerConnection(config);
      let stream = video.srcObject;
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      peerConnection
        .createOffer()
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit('offer', id, peerConnection.localDescription, typeGlobal);
        });

      if (type === 'student') {
        this.setState({
          students: { ...this.state.students, [id]: peerConnection },
        });
      } else if (type === 'teacher') {
        this.setState({
          teacher: { [id]: peerConnection },
        });
      }
    });

    socket.on('answer', (id, description) => {
      this.state.students[id].setRemoteDescription(description);
    });

    socket.on('offer', (id, description, type) => {
      const peerConnection = new RTCPeerConnection(config);

      //peerConnections[id] = peerConnection;

      const video = document.getElementById('self');
      let stream = video.srcObject;
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit('answer', id, peerConnection.localDescription);
        });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      if (type === 'student') {
        this.setState({
          students: { ...this.state.students, [id]: peerConnection },
        });
      } else if (type === 'teacher') {
        this.setState({
          teacher: { [id]: peerConnection },
        });
      }
    });

    socket.on('candidate', (id, candidate) => {
      this.state.students[id].addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('disconnectPeer', (id) => {
      const students = this.state.students;
      const teacher = this.state.teacher;

      if (Object.keys(students).includes(id)) {
        students[id].close();
        delete students[id];
        delete this[id];
        console.log('disconnecting', id);
        this.setState({ students: { ...students } });
      }
      if (Object.keys(teacher).includes(id)) {
        teacher[id].close();
        delete teacher[id];
        delete this[id];
        this.setState({ teacher: { ...teacher } });
      }

      // if (type === 'student') {
      //   const temp = this.state.students;
      //   temp[id].close();
      //   delete temp[id];
      //   this.setState({ students: temp });
      // } else if (type === 'teacher') {
      //   const temp = this.state.teacher;
      //   temp[id].close();
      //   delete temp[id];
      //   this.setState({ teacher: temp });
      // }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    Object.keys(this.state.students).forEach((student) => {
      this.state.students[student].ontrack = (event) => {
        this[student].srcObject = event.streams[0];
      };
    });

    // if (
    //   !prevState.students ||
    //   Object.keys(prevState.students).length !==
    //     Object.keys(this.state.students).length
    // ) {
    //   let student;
    //   if (!prevState.students) {
    //     student = Object.keys(this.state.students);
    //   } else {
    //     student = Object.keys(this.state.students).filter(
    //       (student) => !Object.keys(prevState.students).includes(student)
    //     );
    //   }
    //   console.log('changing', student);
    //   this.state.students[student[0]].ontrack = (event) => {
    //     this[student[0]].srcObject = event.streams[0];
    //   };
    // }
  }

  render() {
    console.log('rendering');
    return (
      <div id="videos">
        <video
          id="self"
          className="video_player"
          playsInline
          autoPlay
          muted
        ></video>

        {Object.keys(this.state.students).map((student, idx) => {
          return (
            <video
              id={student}
              className="video_player"
              playsInline
              autoPlay
              muted
              key={idx}
              ref={(vid) => {
                this[student] = vid;
              }}
            ></video>
          );
        })}
      </div>
    );
  }
}

export default Video;
