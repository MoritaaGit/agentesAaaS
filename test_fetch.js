const URL_API = "https://script.google.com/macros/s/AKfycbzNxABv8lvXmlkVOnsXMkLqnVMkolZAVv3FBh1rbU2HbZLI8tkk_kMzfg81w-FfYKhB/exec";

async function test() {
  try {
    const res = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'sendMessage',
        apiKey: 'uise3t26',
        idAgente: '1',
        correoId: 'estudiante@uis.edu.co',
        mensaje: 'Hola'
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
