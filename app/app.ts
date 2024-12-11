import  { StringManager } from "../bitap/pkg/bitap";

const sm = new StringManager();
sm.register(0, "hogeはひふへほはひふへのhogeはひふへほ");
sm.register_keyword("はひふ")
console.log(Array.from(sm.find_all(0)));
