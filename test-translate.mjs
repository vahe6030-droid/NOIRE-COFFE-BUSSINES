import { pipeline } from "@huggingface/transformers";

console.log("Загружаю модель...");

const translator = await pipeline(
  "translation",
  "Xenova/nllb-200-distilled-600M"
);

console.log("Модель загружена.");

const en = await translator("Оформить заказ", {
  src_lang: "rus_Cyrl",
  tgt_lang: "eng_Latn",
});

console.log("EN:", en);

const hy = await translator("Оформить заказ", {
  src_lang: "rus_Cyrl",
  tgt_lang: "hye_Armn",
});

console.log("HY:", hy);