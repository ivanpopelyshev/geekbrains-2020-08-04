import 'regenerator-runtime/runtime'

import "./styles.css";
import { App } from "./app";

let app = new App();
document.getElementById("app").appendChild(app.view);


try {
  if (module.hot) {
    module.hot.dispose(function() {
      console.log("destroyed");
      app.destroy();
    });
  }
} catch (e) {}

if (!window.config) {
  window.config = { token: '', nickname: 'local_client' };
}

try {
  VK.init(function () {
    VK.api("users.get", {"fields": "last_name"}, function (data) {
      const lastname = data.response[0].lastname;
      console.log("user lastname:", lastname);
      window.config.nickname = lastname + '';
    });
    app.runners.onStartup.run();

  }, function () {
    //WTF
  }, '5.122');
} catch {
  //running locally
  app.runners.onStartup.run();
}
