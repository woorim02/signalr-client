import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

function App() {
  const [connection, setConnection] = useState(null);
  const [groupId, setGroupId] = useState('df25195d-4ae3-4fb2-a7d4-2128b1ee3fa7'); // 실제 그룹 ID로 변경
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://api.test.guntaxi.com/chat-hub')
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(result => {
          console.log('Connected!');

          // 그룹에 참가
          connection.invoke('JoinGroup', groupId);

          connection.on('ReceiveMessage', (message) => {
            setMessages(messages => [...messages, message]);
          });

          connection.on('LoadMessages', (loadedMessages) => {
            setMessages(loadedMessages);
          });
        })
        .catch(e => console.log('Connection failed: ', e));
    }
  }, [connection]);

  const [userId, setUserId] = useState('f35e1572-3167-4513-8170-422b2f580f24'); // 실제 사용자 ID로 변경
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    if (connection.connectionStarted) {
      try {
        await connection.send('SendMessage', groupId, userId, message);
        setMessage('');
      } catch (e) {
        console.log(e);
      }
    } else {
      alert('No connection to server yet.');
    }
  };

  return (
    <div>
      <div>
        {messages.map((m, index) => (
          <div key={index}>
            <strong>{m.sender.userName}:</strong> {m.message}
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

