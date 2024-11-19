const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("div#app does not found.");
app.innerText = "hello, typescript!";
