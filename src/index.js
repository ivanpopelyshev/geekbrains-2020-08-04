import "./styles.css";
import { App } from "./app";

let app = new App();
document.getElementById("app").appendChild(app.view);

app.runners.onStartup.run();

try {
  if (module.hot) {
    module.hot.dispose(function() {
      console.log("destroyed");
      app.destroy();
    });
  }
} catch (e) {}
