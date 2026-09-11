import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  MaintenanceRequest,
  ScheduledBlock,
  OptimizationMetrics,
  CandidatePlan,
  BreakdownByMaintenance
} from '../types';

export const MAINTENANCE_COLLECTION = 'maintenance_schedules';
export const OPTIMIZATION_COLLECTION = 'optimization_plans';
export const EMERGENCY_COLLECTION = 'emergency_incidents';

/**
 * Check if Firebase Firestore is active and ready
 */
export const isFirestoreReady = (): boolean => {
  return db !== null && typeof db === 'object' && 'type' in db;
};

/**
 * Save or update a single maintenance schedule in Firebase Firestore
 */
export const saveMaintenanceRequestToFirebase = async (
  maint: MaintenanceRequest
): Promise<boolean> => {
  const firestore = db;
  if (!firestore) return false;
  try {
    const docRef = doc(firestore, MAINTENANCE_COLLECTION, maint.id);
    await setDoc(
      docRef,
      {
        ...maint,
        updatedAt: serverTimestamp(),
        source: 'RailOpt_AI_Portal',
        project: 'rail-ai-bcbeb'
      },
      { merge: true }
    );
    console.log(`[Firebase Firestore] Maintenance schedule #${maint.id} stored successfully.`);
    return true;
  } catch (error) {
    console.warn(`[Firebase Firestore] Could not save maintenance schedule #${maint.id}:`, error);
    return false;
  }
};

/**
 * Batch synchronize complete list of maintenance schedules to Firebase Firestore
 */
export const syncAllMaintenanceToFirebase = async (
  requests: MaintenanceRequest[]
): Promise<boolean> => {
  const firestore = db;
  if (!firestore || requests.length === 0) return false;
  try {
    const batch = writeBatch(firestore);
    requests.forEach((req) => {
      const docRef = doc(firestore, MAINTENANCE_COLLECTION, req.id);
      batch.set(
        docRef,
        {
          ...req,
          syncedAt: serverTimestamp(),
          project: 'rail-ai-bcbeb'
        },
        { merge: true }
      );
    });
    await batch.commit();
    console.log(`[Firebase Firestore] Synced ${requests.length} maintenance schedules to Firestore.`);
    return true;
  } catch (error) {
    console.warn('[Firebase Firestore] Failed to batch sync maintenance schedules:', error);
    return false;
  }
};

/**
 * Delete a maintenance schedule document from Firebase Firestore
 */
export const deleteMaintenanceFromFirebase = async (id: string): Promise<boolean> => {
  const firestore = db;
  if (!firestore) return false;
  try {
    const docRef = doc(firestore, MAINTENANCE_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`[Firebase Firestore] Deleted maintenance schedule #${id}.`);
    return true;
  } catch (error) {
    console.warn(`[Firebase Firestore] Could not delete maintenance schedule #${id}:`, error);
    return false;
  }
};

/**
 * Clear all maintenance schedules from Firebase Firestore
 */
export const clearAllMaintenanceFromFirebase = async (): Promise<boolean> => {
  const firestore = db;
  if (!firestore) return false;
  try {
    const colRef = collection(firestore, MAINTENANCE_COLLECTION);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    console.log('[Firebase Firestore] Cleared all maintenance schedules from Firestore.');
    return true;
  } catch (error) {
    console.warn('[Firebase Firestore] Failed to clear all maintenance schedules:', error);
    return false;
  }
};

/**
 * Fetch all maintenance schedules directly from Firebase Firestore
 */
export const fetchMaintenanceFromFirebase = async (): Promise<MaintenanceRequest[]> => {
  const firestore = db;
  if (!firestore) return [];
  try {
    const colRef = collection(firestore, MAINTENANCE_COLLECTION);
    const snapshot = await getDocs(colRef);
    const schedules: MaintenanceRequest[] = [];
    snapshot.forEach((d) => {
      schedules.push(d.data() as MaintenanceRequest);
    });
    return schedules;
  } catch (error) {
    console.warn('[Firebase Firestore] Failed to fetch maintenance schedules from Firestore:', error);
    return [];
  }
};

/**
 * Real-time listener for maintenance schedules in Firebase Firestore
 */
export const subscribeToMaintenanceSchedules = (
  onUpdate: (schedules: MaintenanceRequest[]) => void
): (() => void) => {
  const firestore = db;
  if (!firestore) return () => {};
  try {
    const colRef = collection(firestore, MAINTENANCE_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const schedules: MaintenanceRequest[] = [];
        snapshot.forEach((d) => {
          schedules.push(d.data() as MaintenanceRequest);
        });
        if (schedules.length > 0) {
          onUpdate(schedules);
        }
      },
      (error) => {
        console.warn('[Firebase Firestore] Realtime subscription notice:', error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase Firestore] Could not establish realtime listener:', error);
    return () => {};
  }
};

/**
 * Save the complete AI Optimization Plan & Strategy Schedule to Firebase Firestore
 */
export const saveOptimizationPlanToFirebase = async (data: {
  selectedPlanId: string;
  plan: ScheduledBlock[];
  metrics: OptimizationMetrics | null;
  candidatePlans: CandidatePlan[];
  breakdownByMaintenance?: Record<string, BreakdownByMaintenance>;
}): Promise<boolean> => {
  const firestore = db;
  if (!firestore) return false;
  try {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const docId = `plan_${data.selectedPlanId || 'default'}_${timestampStr}`;
    const docRef = doc(firestore, OPTIMIZATION_COLLECTION, docId);

    await setDoc(docRef, {
      ...data,
      timestamp: serverTimestamp(),
      savedAt: new Date().toISOString(),
      project: 'rail-ai-bcbeb'
    });

    // Also update current active plan
    const activeRef = doc(firestore, OPTIMIZATION_COLLECTION, 'active_current_plan');
    await setDoc(activeRef, {
      ...data,
      lastUpdated: serverTimestamp(),
      savedAt: new Date().toISOString(),
      project: 'rail-ai-bcbeb'
    }, { merge: true });

    console.log(`[Firebase Firestore] Complete optimization plan stored to Firestore document #${docId}.`);
    return true;
  } catch (error) {
    console.warn('[Firebase Firestore] Failed to store complete optimization plan to Firestore:', error);
    return false;
  }
};
