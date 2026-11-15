const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.enforceOrderHistoryRetention = onSchedule(
  { schedule: "every 15 minutes", timeZone: "Asia/Dhaka", region: "asia-south1", timeoutSeconds: 540, memory: "512MiB" },
  async () => {
    const now = Date.now();
    const mainHistoryCutoff = Timestamp.fromMillis(now - 3 * 24 * 60 * 60 * 1000);
    const deletedHistoryCutoff = Timestamp.fromMillis(now - 7 * 24 * 60 * 60 * 1000);
    const snapshot = await db.collection("orders").get();

    for (const orderDoc of snapshot.docs) {
      await db.runTransaction(async tx => {
        const ref = db.collection("orders").doc(orderDoc.id);
        const fresh = await tx.get(ref);
        if (!fresh.exists) return;
        const order = fresh.data();
        const status = String(order.status || "");
        const terminal = ["Completed", "Complete", "Cancelled", "Cancel", "Rejected"].includes(status);

        if (order.isArchived === true) {
          const archivedAt = order.archivedAt;
          if (!archivedAt || typeof archivedAt.toMillis !== "function" || archivedAt.toMillis() > deletedHistoryCutoff.toMillis()) return;

          if (["Completed", "Complete"].includes(status)) {
            const ledgerRef = db.collection("salesLedger").doc(orderDoc.id);
            const ledger = await tx.get(ledgerRef);
            if (!ledger.exists) {
              tx.set(ledgerRef, {
                orderId: orderDoc.id,
                amount: Number(order.price) || 0,
                packageName: order.packageName || "Diamond Order",
                customerUid: order.userId || order.customerUid || "",
                completedAt: order.statusChangedAt || order.updatedAt || order.createdAt || archivedAt,
                archivedAt,
                recordedAt: FieldValue.serverTimestamp()
              });
            }
          }
          tx.delete(ref);
          return;
        }

        if (!terminal) return;
        const terminalAt = order.statusChangedAt || order.updatedAt || order.createdAt;
        if (!terminalAt || typeof terminalAt.toMillis !== "function") return;
        if (terminalAt.toMillis() <= mainHistoryCutoff.toMillis()) {
          tx.update(ref, {
            isArchived: true,
            archivedAt: FieldValue.serverTimestamp(),
            retentionMovedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      });
    }
  }
);
