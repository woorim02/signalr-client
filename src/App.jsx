import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

function App() {
  const [connection, setConnection] = useState(null);
  const [groupId, setGroupId] = useState('df25195d-4ae3-4fb2-a7d4-2128b1ee3fa7'); // 실제 그룹 ID로 변경
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState('f35e1572-3167-4513-8170-422b2f580f24'); // 실제 사용자 ID로 변경
  const [message, setMessage] = useState('');

  // SignalR connection 생성 및 연결
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://api.test.guntaxi.com/chat-hub', {
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information) // 디버깅을 위해 로그 활성화
      .build();

    setConnection(newConnection);
  }, []);

  // SignalR 연결 시작 및 이벤트 핸들러 설정
  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Connected!');

          // 그룹에 참가
          connection.invoke('JoinGroup', groupId);

          // 서버에서 오는 메시지 처리
          connection.on('ReceiveMessage', (message) => {
            setMessages(messages => [...messages, message]);
          });

          // 서버에서 LoadMessages 이벤트 처리
          connection.on('LoadMessages', (loadedMessages) => { // 여기서 서버의 "LoadMessages" 이벤트를 처리
            setMessages(loadedMessages);
          });

        })
        .catch(e => console.log('Connection failed: ', e));
    }
  }, [connection, groupId]);

  // 메시지 전송 함수
  const sendMessage = async () => {
    if (connection.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.send('SendMessage', groupId, userId, message);
        setMessage('');
      } catch (e) {
        console.log('Error sending message:', e);
      }
    } else {
      alert('No connection to server yet.');
    }
  };

  return (
    <div>
      <div>
        <h2>Chat Messages</h2>
        {messages.map((m, index) => (
          <div key={index}>
            <strong>{m.sender?.userName || 'Unknown User'}:</strong> {m.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
