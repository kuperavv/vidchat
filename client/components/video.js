import { io } from 'socket.io-client';
import React, { Component } from 'react';

const socket = io();

const peerConnections = {};

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
    this.state = { members: [], videos: [] };
  }
  componentDidMount() {
    const video = document.getElementById('self');

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        video.srcObject = stream;
        socket.emit('broadcaster', socket.id);
      })
      .catch((error) => console.error(error));

    socket.on('broadcaster', (id) => {
      const video = document.getElementById('self');
      const peerConnection = new RTCPeerConnection(config);
      peerConnections[id] = peerConnection;
      console.log('this is a peer connection', peerConnection);
      let stream = video.srcObject;
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      const other = document.getElementById('other');
      peerConnection.ontrack = (event) => {
        other.srcObject = event.streams[0];
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      peerConnection
        .createOffer()
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit('offer', id, peerConnection.localDescription);
        });

      // this.setState({
      //   peerConnections: {
      //     ...this.state.peerConnections,
      //     [id]: peerConnection,
      //   },
      // });
      this.setState({ members: [...this.state.members, id] });
    });

    socket.on('answer', (id, description) => {
      // this.setState({
      //   peerConnections: {
      //     ...this.state.peerConnections,
      //     [id]: this.state.peerConnections[id].setRemoteDescription(
      //       description
      //     ),
      //   },
      // });
      peerConnections[id].setRemoteDescription(description);
    });

    socket.on('offer', (id, description) => {
      const peerConnection = new RTCPeerConnection(config);
      //console.log(peerConnection);

      //NEW
      // const peerConnection = new RTCPeerConnection(config);
      peerConnections[id] = peerConnection;
      this.setState({ members: [...this.state.members, id] });

      peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit('answer', id, peerConnection.localDescription);
        });

      // const userVideo = document.createElement('VIDEO');
      // userVideo.classList.add('video_player');
      // userVideo.id = id;
      // userVideo.autoPlay = true;
      // userVideo.playsInline = true;
      // userVideo.muted = true;
      //const videos = document.getElementById('videos');
      //videos.appendChild(userVideo);
      const other = document.getElementById('other');
      peerConnection.ontrack = (event) => {
        other.srcObject = event.streams[0];
      };

      //this.setState({ videos: [...this.state.videos, userVideo] });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };
    });

    socket.on('candidate', (id, candidate) => {
      console.log(peerConnections[id]);
      // const temp = this.state.peerConnections[id];
      // temp.addIceCandidate(new RTCIceCandidate(candidate));
      // this.setState({
      //   peerConnections: {
      //     ...this.state.peerConnections,
      //     [id]: this.state.peerConnections[id].addIceCandidate(
      //       new RTCIceCandidate(candidate)
      //     ),
      //   },
      // });
      peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    });
  }

  render() {
    console.log(this.state);
    return (
      <div id="videos">
        <video
          id="self"
          className="video_player"
          playsInline
          autoPlay
          muted
        ></video>
        <video
          id="other"
          className="video_player"
          playsInline
          autoPlay
          muted
        ></video>
      </div>
    );
  }
}

export default Video;
