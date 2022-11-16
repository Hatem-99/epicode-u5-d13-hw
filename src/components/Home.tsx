import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormControl,
  ListGroup,
  Button,
} from "react-bootstrap";
import { io } from "socket.io-client";
import { Message, User } from "../types";

// 1. When we jump into this page, the socketio client connects to the server
// 2. If the connection happens successfully the server will emit an event called "welcome"
// 3. If we want to do something when that event happens --> we shall LISTEN to that event by using socket.on("welcome")
// 4. Once we are in we want to submit the username --> we shall EMIT an event called "setUsername"
// 5. Server listen for "setUsername" event and it sends to whoever is listening the list of online users with a "loggedIn" event
// 6. If client wants to display the list of online users, it should listen for the "loggedIn" event
// 7. In this way the list of online users is updated only during login, but what happens if a new user joins? Server emits a "newConnection" event containing an update list
// 8. We shall listen to the "newConnection" event to update the list when somebody joins or leaves
// 9. When client sends a message it should trigger a "sendMessage" event
// 10. Server listens for that and then broadcast to everybody but the sender an event called "newMessage", who is listening for that can now display the new message

const socket = io("http://localhost:3001", { transports: ["websocket"] });

const Home = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  useEffect(() => {
    socket.on("welcome", (welcomeMessage) => {
      socket.on("loggedIn", onlineUsersList => {
        setLoggedIn(true)
        setOnlineUsers(onlineUsersList)


        socket.on("newConnection", onlineUsersList => {
          setOnlineUsers(onlineUsersList)
        })

        socket.on("newMessage", receivedMessage => {
          setChatHistory(chatHistory => [...chatHistory, receivedMessage.message])
        })
      })
    });
  });

  const submitUserName = () => {

    socket.emit("setUsername", { username })
  }
const sendAMessage = () => {
  const newMessage: Message = {
    sender: username,
    text: message,
    createdAt: new Date().toUTCString(),
  }
  socket.emit("sendMessage", { message: newMessage })
  setChatHistory([...chatHistory, newMessage])
}
  return (
    <Container fluid>
      <Row style={{ height: "95vh" }} className="my-3">
        <Col md={9} className="d-flex flex-column justify-content-between">
          {/* LEFT COLUMN */}
          {/* TOP AREA: USERNAME INPUT FIELD */}
          {/* {!loggedIn && ( */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              submitUserName()
            }}
          >
            <FormControl
              placeholder="Set your username here"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loggedIn}
            />
          </Form>
          {/* )} */}
          {/* MIDDLE AREA: CHAT HISTORY */}
          <ListGroup>
            {chatHistory.map((element, i) => (
              <ListGroup.Item key={i}>
                <strong>{element.sender} </strong> | {element.text} at{" "}
                {new Date(element.createdAt).toLocaleTimeString("en-US")}
              </ListGroup.Item>
            ))}
          </ListGroup>
          {/* BOTTOM AREA: NEW MESSAGE */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              sendAMessage()
            }}
          >
            <FormControl
              placeholder="Write your message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!loggedIn}
            />
          </Form>
        </Col>
        <Col md={3}>
          {/* ONLINE USERS SECTION */}
          <div className="mb-3">Connected users:</div>
          {onlineUsers.length === 0 && (
            <ListGroup.Item>Log in to check who's online!</ListGroup.Item>
          )}
          <ListGroup>
            {onlineUsers.map((user, i) => (
              <ListGroup.Item key={i}>{user.username}</ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
