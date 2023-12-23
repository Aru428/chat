import "../styles/chat.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chat from "./Chat";
import Notice from "./Notice";
import io from "socket.io-client";

const socket = io.connect("http://localhost:8000", { autoConnect: false });

export default function Chatting() {
  const [msgInput, setMsgInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [userList, setUserList] = useState({});
  const [frontList, setFrontList] = useState([]);
  const [backList, setBackList] = useState([]);
  const [fullList, setFullList] = useState([]);
  const [dmTo, setDmTo] = useState("all");
  const [roomId, setRoomId] = useState("FRONTEND");

  const initSocketConnect = () => {
    console.log("connected", socket.connected);
    if (!socket.connected) socket.connect();
  };

  useEffect(() => {
    socket.on("error", (res) => {
      alert(res.msg);
    });

    socket.on("entrySuccess", (res) => {
      setUserId(res.userId);
    });

    socket.on("userList", (res) => {
      setUserList(res);
    });

    socket.on("updateFrontList", (res) => {
      setFrontList(res);
    });

    socket.on("updateBackList", (res) => {
      setBackList(res);
    });

    socket.on("updateFullList", (res) => {
      setFullList(res);
    });
  }, []);

  useEffect(() => {
    const notice = (res) => {
      const newChatList = [...chatList, { type: "notice", content: res.msg }];

      setChatList(newChatList);
    };

    socket.on("notice", notice);

    return () => socket.off("notice", notice);
  }, [chatList]);

  // useCallback : 함수를 메모라이징 한다
  // 뒤에 있는 의존성 배열에 있는 값이 update 될 때만 함수를 다시 선언함
  const addChatList = useCallback(
    (res) => {
      const type = res.userId === userId ? "my" : "other";
      const content = `${res.dm ? "(속닥속닥)" : ""} ${res.userId} : ${
        res.msg
      }`;
      const newChatList = [...chatList, { type: type, content: content }];
      setChatList(newChatList);
    },
    [userId, chatList]
  );

  useEffect(() => {
    socket.on("chat", addChatList);
    return () => socket.off("chat", addChatList);
  }, [addChatList]);

  const sendMsg = () => {
    if (msgInput !== "") {
      socket.emit("sendMsg", {
        userId: userId,
        msg: msgInput,
        dm: dmTo,
        roomId: roomId,
      });
      setMsgInput("");
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") sendMsg();
  };

  const EntryhandleEnter = (e) => {
    if (e.key === "Enter") entryChat();
  };

  const entryChat = () => {
    initSocketConnect();
    socket.emit("entry", { userId: userIdInput, roomId: roomId });
  };

  // useMemo : 값을 메모라이징 한다.
  // 뒤에 있는 의존성 배열에 있는 값이 update 될 때마다 연산을 실행함
  const userListOptions = useMemo(() => {
    let chooseList;
    if (roomId === "FRONTEND") chooseList = frontList;
    else if (roomId === "BACKEND") chooseList = backList;
    const options = [];
    for (const key in chooseList) {
      if (chooseList[key] === userId) continue;
      options.push(
        <option key={key} value={key}>
          {chooseList[key]}
        </option>
      );
    }
    return options;
  }, [userList, frontList, backList]);

  const userListDivs = useMemo(() => {
    let chooseList;
    if (roomId === "FRONTEND") chooseList = frontList;
    else if (roomId === "BACKEND") chooseList = backList;
    else chooseList = fullList;

    const divs = [];
    for (const key in chooseList) {
      if (chooseList[key] === userId) continue;
      divs.push(
        <div>
          <hr />
          <p className="user">👤 {chooseList[key]}</p>
        </div>
      );
    }
    return divs;
  }, [userList, frontList, backList, fullList]);

  return (
    <div className="chatting">
      <h2>SeSAC Chat</h2>
      {userId ? (
        <>
          <div className="main">
            <div className="chat-nav">
              <button>✖️</button>
              <p>{roomId}</p>
            </div>
            <div className="main-container">
              <div className="chat-userlist">
                <p>대화 상대</p>
                <hr />
                <p className="user">👤 나</p>
                {userListDivs}
              </div>
              <div className="chat">
                <div className="chat-container">
                  {chatList.map((chat, i) => {
                    if (chat.type === "notice")
                      return <Notice key={i} chat={chat} />;
                    else return <Chat key={i} chat={chat} />;
                  })}
                </div>
                <div className="input-container">
                  <select
                    value={dmTo}
                    onChange={(e) => setDmTo(e.target.value)}
                  >
                    <option value="all">전체</option>
                    {userListOptions}
                  </select>
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={handleEnter}
                  />
                  <button onClick={sendMsg}>전송</button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="entry-container ">
            <input
              type="text"
              placeholder="닉네임을 입력해주세요"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyDown={EntryhandleEnter}
            />
            <br />
            <div>채팅방 선택</div>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="FRONTEND">FRONTEND</option>
              <option value="BACKEND">BACKEND</option>
              <option value="FULLSTACK">FULLSTACK</option>
            </select>
            <br />
            <button onClick={entryChat}>입장</button>
          </div>
        </>
      )}
    </div>
  );
}
