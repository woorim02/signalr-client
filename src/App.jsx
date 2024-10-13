import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

function App() {
  const [connection, setConnection] = useState(null);
  const [groupId, setGroupId] = useState(""); // 사용자 입력을 통한 그룹 ID
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [pageNo] = useState(1);
  const [pageSize] = useState(20); // 페이지당 메시지 수
  const [token, setToken] = useState(""); // JWT 토큰 사용자 입력

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
            setMessages(paginationDto.items); // 서버에서 받은 메시지 설정
          });
        })
        .catch((err) => console.error("Connection failed: ", err));
    }
  }, [connection, groupId, pageNo, pageSize]);

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
    <div>
      <h2>Chat Application</h2>

      {/* JWT 토큰과 그룹 ID 입력 폼 */}
      <div>
<<<<<<< HEAD
        <h2>Chat Messages</h2>
        {messages.map((m, index) => (
          <div key={index}>
            <strong>{m.sender?.nickName || 'Unknown User'}:</strong> {m.message}
          </div>
        ))}
=======
        <input
          type="text"
          placeholder="JWT Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          type="text"
          placeholder="Group ID"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        />
        <button onClick={handleConnect}>Connect</button>
      </div>

      <div>
        <h3>Chat Messages in Group: {groupId}</h3>
        <div style={{ height: "300px", overflowY: "scroll" }}>
          {messages.map((m, index) => (
            <div key={index}>
              <strong>{m.sender?.nickName || "Unknown User"}</strong>
              {`(${m.timestamp}):`}
              {m.message}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={leaveGroup}>Leave Group</button>
>>>>>>> 30e2adc (먼가먼가)
      </div>
    </div>
  );
}

export default App;
