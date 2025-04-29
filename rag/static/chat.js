async function sendMessage() {
    const input = document.getElementById("user-input");
    const message = input.value.trim();
    if (!message) return;
    appendMessage("You", message);
    input.value = "";
    const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    });
    const data = await res.json();
    appendMessage("Bot", data.reply);
}

function appendMessage(sender, msg) {
    const history = document.getElementById("chat-history");
    const div = document.createElement("div");
    div.innerHTML = `<b>${sender}:</b> ${msg}`;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}