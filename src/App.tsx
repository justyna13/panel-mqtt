import React, {useEffect, useState} from 'react';
import mqtt from "mqtt";

const App = () => {
  const [mqttHost, setMqttHost] = useState(localStorage.getItem("mqttHost") || "");
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [payload, setPayload] = useState<{ topic: string, message: string }>();
  const [quizStatus, setQuizStatus] = useState("");
  const [quizInputs, setQuizInputs] = useState("");
  const [statusLog, setStatusLog] = useState<Array<string>>([]);
  const [triggeredNum, setTriggeredNum] = useState(-1);

  const [armChecked, setArmChecked] = useState(false);
  const [blinkMode, setBlinkMode] = useState(0);
  const [blinkInterval, setBlinkInterval] = useState(200);

  const connectToMqtt = (host: string, mqttOption: mqtt.IClientOptions | undefined = undefined) => {
    console.log("connecting...");
    setClient(mqtt.connect(host, mqttOption));
  };

  const disconnectMqtt = () => {
    if (!client) return;
    client.end();
  }

  const mqttPublish = (topic: string, payload: string) => {
    if (!client) return;
    client.publish(topic, payload);
  }

  const mqttCommand = (commandName: string, args: object = {}) => {
    const msg = JSON.stringify({command: commandName, args: args});
    mqttPublish("quiz/command", msg);
  }

  useEffect(() => {
    localStorage.setItem("mqttHost", mqttHost);
  }, [mqttHost]);

  useEffect(() => {
    const mqttSub = (topic: string) => {
      if (!client) return;
      client.subscribe(topic);
    }

    if (!client) return;
    console.log(client);
    client.on("connect", () => {
      console.log("connected");
      mqttSub("quiz/status");
      mqttSub("quiz/inputs");
      mqttSub("quiz/command_resp");
      mqttSub("quiz/triggered");
    });
    client.on("end", () => {
      console.log("disconnected");
      setClient(null);
    });
    client.on("error", (err) => {
      console.error(err);
      client.end();
    });
    client.on("reconnect", () => {
      console.log("reconnecting");
    });
    client.on("message", (topic, message) => {
      const _payload = {topic, message: message.toString()};
      setPayload(_payload);
      switch (topic) {
        case "quiz/status":
          setQuizStatus(message.toString());
          break;
        case "quiz/inputs":
          setQuizInputs(message.toString());
          break;
        case "quiz/command_resp":
          setStatusLog((status) => {
            status.push(message.toString());
            return status;
          })
          break;
        case "quiz/triggered":
          const data: {first_btn_num: number} = JSON.parse(message.toString());
          setTriggeredNum(data.first_btn_num);
          break;
        default:
          break;
      }
    });
  }, [client]);

  const cmdMirror = () => {
    mqttCommand("mirror");
  }

  const cmdBlink = () => {
    mqttCommand("blink", {
      mode: blinkMode,
      interval: blinkInterval,
    });
  }

  const cmdClear = () => {
    mqttCommand("clear", {arm: armChecked});
  }

  return (
    <div>
      <div>
        {
          client ? (
            <div>
              <button onClick={disconnectMqtt}>Disconnect</button> <br/>
              <p>Status: {quizStatus}</p>
              <p>Inputs: {quizInputs}</p>
              <p>Last trigger: {triggeredNum}</p>
            </div>
          ) : (
            <div>
              <button onClick={() => connectToMqtt("mqtt://10.0.0.101:9001")}>Connect</button>
              &nbsp;&nbsp;
              Host: <input type={"text"} value={mqttHost} onChange={e => setMqttHost(e.target.value)}/>
            </div>
          )
        }
      </div> <br/>
      <div>
        <button onClick={cmdMirror}>Mirror</button>
        <br/> <br/>
        <button onClick={cmdBlink}>Blink</button>&nbsp;&nbsp;Mode&nbsp;
        <select onChange={e => setBlinkMode(parseInt(e.target.value))} value={blinkMode}>
          <option value={0}>Static</option>
          <option value={1}>Rolling</option>
          <option value={2}>Up Down</option>
        </select>&nbsp;&nbsp;
        Interval
        <input type={"number"} value={blinkInterval} onChange={e => setBlinkInterval(parseInt(e.target.value))}/>
        <br/> <br/>
        <button onClick={cmdClear}>Clear</button> <input type={"checkbox"} checked={armChecked} onChange={() => setArmChecked(!armChecked)} /> Arm
        <br/> <br/>
      </div> <br/>
      <div>
        <pre style={{maxHeight: '200px', overflow: 'scroll', width: '50vw'}}>
          {statusLog.map((status, index) => (<p key={index}>{status}</p>))}
        </pre>
      </div>

    </div>
  );
};

export default App;
