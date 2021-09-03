const decryptButton = document.getElementById('decrypt');
const encryptButton = document.getElementById('encrypt');
const downloadButton = document.getElementById('download');
const textArea = document.getElementById('textarea');
const fileInput = document.getElementById('input');

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function download(data) {
  const linkSource = `data:application/octet-stream;base64,${data}`;

  const element = document.createElement("a");
  element.href = linkSource;
  element.style.display = "none";
  element.setAttribute("download", 'cipher');

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

const getKeyMaterial = (pw) => {
  return window.crypto.subtle.importKey(
    "raw",
    encoder.encode(pw),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
};

const createKey = (keyMaterial) => {
  const keyUsages = ["encrypt", "decrypt"];
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint16Array(16),
      iterations: 5000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    keyUsages
  );
};

const getKey = async () => {
  const enteredPassword = window.prompt('Enter password');

  if (enteredPassword === null || enteredPassword.length === 0) {
    return null;
  } else {
    const keyMaterial = await getKeyMaterial(enteredPassword);
    const key = await createKey(keyMaterial);
    return key;
  }
};

encryptButton.onclick = async () => {
  const data = textArea.value;
  const key = await getKey();
  const encodedData = encoder.encode(data);

  try {
    const cipher = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: new Uint8Array(16) },
      key,
      encodedData
    );
  
    const base64 = arrayBufferToBase64(cipher);
  
    textArea.value = base64;
  } catch {}
}

decryptButton.onclick = async () => {
  const data = textArea.value;
  const key = await getKey();
  const encodedData = base64ToArrayBuffer(data);

  try {
    const res = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(16) },
      key,
      encodedData
    );

    textArea.value = decoder.decode(res);
  } catch {}
};

downloadButton.onclick = async () => {
  const data = textArea.value;
  download(data);
};

fileInput.onchange = async () => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const split = e.target.result.split('base64,');
    const data = split[1];

    textArea.value = data;
  }
  reader.readAsDataURL(fileInput.files[0]);
};
