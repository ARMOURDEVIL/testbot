const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbotCloseBtn = document.querySelector(".close-btn");
let messageHistory = [];
let userMessage;
let incomingChatLi;

const ws = new WebSocket('ws://localhost:3000'); // WebSocket connection
const inputInitHeight = chatInput.scrollHeight;

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received response:', data);

    if (data.response) {
        const aiMessage = data.response;
        messageHistory.push({ sender: 'ai', content: aiMessage });
        displayMessage(incomingChatLi, 'ai', aiMessage);
    } else if (data.error) {
        console.error('Error from server:', data.error);
    }
};

ws.onclose = () => {
    console.log('Disconnected from the WebSocket server');
};

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">Smart_toy</span><p></p>`
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}

const generateResponse = (incomingChatLi) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = incomingChatLi.querySelector("p");
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{role: "user", content: userMessage}]
        })
    }

    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        messageElement.textContent = data.choices[0].message.content;
    }).catch((error) => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;
    chatInput.value = "";
   

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
        incomingChatLi = createChatLi("Thinking...", "incoming")
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        messageHistory.push({ sender: 'user', content: userMessage });
        ws.send(JSON.stringify({ messageHistory })); // Send message history to WebSocket server
        // generateResponse(incomingChatLi);
    }, 600);
}

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
chatbotCloseBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));


const displayMessage = (incomingChatLi, sender, message) => {
    const className = sender === 'user' ? 'outgoing' : 'incoming';
    const messageElement = incomingChatLi.querySelector("p");
    messageElement.textContent = message;
}