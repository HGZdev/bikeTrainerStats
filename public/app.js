document.getElementById("connect").addEventListener("click", async () => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{namePrefix: "KICKR"}], // Select only Wahoo KICKR
      optionalServices: ["cycling_power", "fitness_machine"],
    });

    document.getElementById("status").innerText = `Connected: ${device.name}`;
    const server = await device.gatt.connect();
    console.log("✅ Connected to GATT Server");

    // 🔹 Get pedal power and cadence
    const powerService = await server.getPrimaryService("cycling_power");
    const powerChar = await powerService.getCharacteristic(
      "cycling_power_measurement"
    );

    powerChar.addEventListener("characteristicvaluechanged", (event) => {
      let value = event.target.value;
      let data = new DataView(value.buffer);

      let power = data.getInt16(2, true); // Pedal power (W)
      let cadence = (data.getUint16(4, true) & 0x0fff) / 2; // Cadence (rpm)

      console.log(`🚴 Power: ${power} W | Cadence: ${cadence} rpm`);
      document.getElementById(
        "status"
      ).innerText = `Power: ${power} W | Cadence: ${cadence} rpm`;
    });

    await powerChar.startNotifications();
    console.log("📡 Receiving power and cadence...");

    // 🔹 Get speed and distance
    const fitnessService = await server.getPrimaryService("fitness_machine");
    const speedChar = await fitnessService.getCharacteristic(
      "fitness_machine_speed"
    );
    const distanceChar = await fitnessService.getCharacteristic(
      "fitness_machine_distance"
    );

    speedChar.addEventListener("characteristicvaluechanged", (event) => {
      let speed = event.target.value.getUint16(0, true) / 100; // Speed in km/h
      console.log(`🚴‍♂️ Speed: ${speed} km/h`);
    });

    distanceChar.addEventListener("characteristicvaluechanged", (event) => {
      let distance = event.target.value.getUint32(0, true) / 100; // Distance in meters
      console.log(`📏 Distance: ${distance} m`);
    });

    await speedChar.startNotifications();
    await distanceChar.startNotifications();
    console.log("📡 Receiving speed and distance...");
  } catch (error) {
    console.error("❌ Connection error:", error);
  }
});
