const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

// create a variable to hold db connection
let db;
// establish a conection to indexedDB called "budget" and set it to version 1.
const request = indexedDB.open("my-budget-tracker", 1);

request.onupgradeneeded = (event) => {
  // reeference to the database
  const db = event.target.result;
  db.createObjectStore(["new_transaction"], {
    keyPath: "id",
    autoIncrement: true,
  });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    addTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorcode);
};

// This function will be executed if we attempt to submit a new transaction and there is no internet connection
function saveRecord(record) {
  const transaction = db.transaction(["new_transaction"], "readwrite");
  const budgetObjectStore = transaction.objectStore(["new_transaction"]);
  budgetObjectStore.add(record);
}

// called when user goes online to send transactions budgetObjectStored in db to server
function addTransaction() {
  const transaction = db.transaction(["new_transaction"], "readwrite");
  const budgetObjectStore = transaction.objectStore(["new_transaction"]);
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          const budgetObjectStore = transaction.objectStore(["new_transaction"]);
          budgetObjectStore.clear();
          alert("transaction has been submitted");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", addTransaction);
