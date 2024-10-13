import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import "./App.css"; // CSS 파일 추가

function App() {
  const [connection, setConnection] = useState(null);
  const [groupId, setGroupId] = useState(""); // 사용자 입력을 통한 그룹 ID
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [pageNo] = useState(1);
  const [pageSize] = useState(20); // 페이지당 메시지 수
  const [token, setToken] = useState(""); // JWT 토큰 사용자 입력

  const messagesEndRef = useRef(null); // 스크롤을 제어하기 위한 ref

  // 스크롤을 맨 아래로 이동시키는 함수
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 그룹 및 JWT 토큰을 입력하고 연결 시작
  const handleConnect = () => {
    if (!token || !groupId) {
      alert("JWT 토큰과 그룹 ID를 입력해 주세요.");
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://api.test.guntaxi.com/chat-hub", {
        accessTokenFactory: () => token, // JWT 토큰을 전송
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information) // 디버깅을 위한 로깅
      .build();

    setConnection(newConnection);
  };

  // SignalR 연결 시작 및 이벤트 핸들러 설정
  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("Connected to SignalR hub!");

          // 기존 핸들러 제거
          connection.off("ReceiveMessage");
          connection.off("LoadMessages");

          // 그룹에 참가
          connection
            .invoke("JoinGroup", groupId)
            .then(() => console.log(`Joined group: ${groupId}`))
            .catch((err) =>
              console.error(`Failed to join group: ${groupId}`, err)
            );

          // 메시지 수신
          connection.on("ReceiveMessage", (chatMessage) => {
            setMessages((messages) => [...messages, chatMessage]);
          });

          // 메시지 로드
          connection
            .invoke("LoadMessages", groupId, pageNo, pageSize)
            .then(() => console.log("Messages loaded"))
            .catch((err) => console.error("Failed to load messages", err));

          connection.on("LoadMessages", (paginationDto) => {
            setMessages(paginationDto.items.reverse()); // 서버에서 받은 메시지 설정
          });
        })
        .catch((err) => console.error("Connection failed: ", err));
    }
  }, [connection, groupId, pageNo, pageSize]);

  // 메시지가 업데이트될 때마다 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const sendMessage = async () => {
    if (
      connection &&
      connection.state === signalR.HubConnectionState.Connected
    ) {
      try {
        await connection.invoke("SendMessage", groupId, message);
        setMessage(""); // 메시지 입력 초기화
      } catch (e) {
        console.error("Failed to send message:", e);
      }
    } else {
      alert("No connection to server yet.");
    }
  };

  // 그룹 나가기
  const leaveGroup = async () => {
    if (
      connection &&
      connection.state === signalR.HubConnectionState.Connected
    ) {
      try {
        await connection.invoke("LeaveGroup", groupId);
        console.log(`Left group: ${groupId}`);
      } catch (e) {
        console.error("Failed to leave group:", e);
      }
    }
  };

  return (
    <div className="app-container">
      <h2 className="app-title">Chat Application</h2>

      {/* JWT 토큰과 그룹 ID 입력 폼 */}
      <div className="input-container">
        <input
          type="text"
          placeholder="JWT Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Group ID"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="input-field"
        />
        <button onClick={handleConnect} className="btn btn-connect">
          Connect
        </button>
      </div>

      <div className="chat-container">
        <h3>Chat Messages in Group: {groupId}</h3>
        <div className="messages-container">
          {messages.map((m, index) => (
            <div key={index} className="message">
              <strong className="message-sender">
                {m.sender?.nickName || "Unknown User"}
              </strong>
              {` (${m.timestamp}): `}
              <span className="message-content">{m.message}</span>
            </div>
          ))}
          {/* 자동 스크롤을 위한 빈 div */}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-message-container">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field message-input"
          />
          <button onClick={sendMessage} className="btn btn-send">
            Send
          </button>
          <button onClick={leaveGroup} className="btn btn-leave">
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
