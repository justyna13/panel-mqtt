import React from 'react';
import mqtt from "mqtt";

const App = () => {
  const connectToMqtt = () => {
    const client = mqtt.connect("mqtt://10.0.0.101");
    console.log(client)
  }

  return (
    <div>
      <button onClick={connectToMqtt}>Connect</button>
      <button>Next</button>
      <button>Next</button>
      <button>Next</button>
    </div>
  );
};

export default App;
