import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RailwayUser, UserRole } from '../types';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: RailwayUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    assignedZone: string,
    designation: string,
    sectionName?: string
  ) => Promise<void>;
  loginDemoUser: (role: UserRole, zone?: string) => void;
  logout: () => Promise<void>;
  switchZone: (zone: string) => void;
  isHead: boolean;
  isOperator: boolean;
  activeZone: string;
}

const LOCAL_STORAGE_KEY = 'railway_active_user';

export const ZONES = [
  { code: 'ALL', name: 'All India Network (HQ / Railway Board)', isHeadOnly: true },
  { code: 'CR', name: 'Central Railway (Mumbai CST, Pune, Bhusawal, Nagpur)', isHeadOnly: false },
  { code: 'NR', name: 'Northern Railway (Delhi, Ambala, Lucknow, Moradabad)', isHeadOnly: false },
  { code: 'WR', name: 'Western Railway (Mumbai Central, Ahmedabad, Vadodara, Ratlam)', isHeadOnly: false },
  { code: 'SR', name: 'Southern Railway (Chennai, Madurai, Palakkad, Salem)', isHeadOnly: false },
  { code: 'ER', name: 'Eastern Railway (Howrah, Sealdah, Asansol, Malda)', isHeadOnly: false },
  { code: 'NCR', name: 'North Central Railway (Prayagraj, Agra, Jhansi)', isHeadOnly: false },
  { code: 'SCR', name: 'South Central Railway (Secunderabad, Vijayawada, Guntakal)', isHeadOnly: false },
  { code: 'ECR', name: 'East Central Railway (Hajipur, Danapur, Dhanbad, DDU)', isHeadOnly: false },
  { code: 'ECoR', name: 'East Coast Railway (Bhubaneswar, Khurda Road, Sambalpur)', isHeadOnly: false },
  { code: 'SECR', name: 'South East Central Railway (Bilaspur, Raipur, Nagpur)', isHeadOnly: false },
  { code: 'WCR', name: 'West Central Railway (Jabalpur, Bhopal, Kota)', isHeadOnly: false },
  { code: 'NWR', name: 'North Western Railway (Jaipur, Ajmer, Bikaner, Jodhpur)', isHeadOnly: false },
  { code: 'SWR', name: 'South Western Railway (Hubballi, Bengaluru, Mysuru)', isHeadOnly: false },
  { code: 'NER', name: 'North Eastern Railway (Gorakhpur, Izzatnagar, Varanasi)', isHeadOnly: false },
  { code: 'NFR', name: 'Northeast Frontier Railway (Guwahati, Katihar, Lumding)', isHeadOnly: false },
  { code: 'SER', name: 'South Eastern Railway (Kolkata, Kharagpur, Ranchi)', isHeadOnly: false },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RailwayUser | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync Firebase Auth state if configured
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          // If we already have user in local state matching uid, retain it
          if (user && user.uid === fbUser.uid) {
            setLoading(false);
            return;
          }

          // Try fetching user profile from Firestore
          if (db) {
            try {
              const docRef = doc(db, 'users', fbUser.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const profile = docSnap.data() as RailwayUser;
                setUser(profile);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
                setLoading(false);
                return;
              }
            } catch (err) {
              console.warn('Firestore user fetch failed, using fallback:', err);
            }
          }

          // Default user profile if not in Firestore
          const fallbackUser: RailwayUser = {
            uid: fbUser.uid,
            email: fbUser.email || 'operator@railways.gov.in',
            displayName: fbUser.displayName || 'Section Controller',
            role: 'OPERATOR',
            assignedZone: 'CR',
            designation: 'Section Dispatch Controller',
            sectionName: 'Central Railway - Itarsi / Nagpur Division'
          };
          setUser(fallbackUser);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallbackUser));
        } else {
          // Only clear if not in demo mode
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.uid && parsed.uid.startsWith('demo-')) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          }
          // Do not overwrite user if already authenticated locally
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase onAuthStateChanged setup error:', e);
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          if (db) {
            const docRef = doc(db, 'users', cred.user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const profile = docSnap.data() as RailwayUser;
              setUser(profile);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
              setLoading(false);
              return;
            }
          }
        } catch (fbError) {
          console.warn('Firebase online login failed, falling back to local credentials/demo:', fbError);
        }
      }

      // Check local registered users or determine role from email
      const isHeadEmail = email.toLowerCase().includes('head') || email.toLowerCase().includes('board') || email.toLowerCase().includes('chairman');
      const detectedZone = email.toUpperCase().includes('NR') ? 'NR' :
        email.toUpperCase().includes('WR') ? 'WR' :
        email.toUpperCase().includes('SR') ? 'SR' :
        email.toUpperCase().includes('ER') ? 'ER' :
        email.toUpperCase().includes('NCR') ? 'NCR' : 'CR';

      const localUser: RailwayUser = {
        uid: `usr-${Date.now()}`,
        email: email,
        displayName: isHeadEmail ? 'Chairman & CEO, Railway Board' : `Section Controller (${detectedZone})`,
        role: isHeadEmail ? 'HEAD' : 'OPERATOR',
        assignedZone: isHeadEmail ? 'ALL' : detectedZone,
        designation: isHeadEmail ? 'Principal Executive Director (Safety & Operations)' : `Section Controller / Dispatcher`,
        sectionName: isHeadEmail ? 'Apex National Railway Operations Center (Rail Bhavan)' : `${detectedZone} Zonal Control Office`,
        createdAt: new Date().toISOString()
      };

      setUser(localUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localUser));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    assignedZone: string,
    designation: string,
    sectionName?: string
  ) => {
    setLoading(true);
    try {
      let uid = `usr-${Date.now()}`;
      if (auth) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          uid = cred.user.uid;
        } catch (fbErr) {
          console.warn('Firebase signup error, saving locally/Firestore fallback:', fbErr);
        }
      }

      const newUser: RailwayUser = {
        uid,
        email,
        displayName,
        role,
        assignedZone: role === 'HEAD' ? 'ALL' : assignedZone,
        designation: designation || (role === 'HEAD' ? 'Railway Board Apex Controller' : 'Zonal Section Controller'),
        sectionName: sectionName || (role === 'HEAD' ? 'Apex National Rail Operations' : `${assignedZone} Operations Desk`),
        createdAt: new Date().toISOString()
      };

      if (db && auth?.currentUser) {
        try {
          await setDoc(doc(db, 'users', uid), newUser);
        } catch (dbErr) {
          console.warn('Firestore setDoc failed:', dbErr);
        }
      }

      setUser(newUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const loginDemoUser = (role: UserRole, zone: string = 'CR') => {
    const demoUser: RailwayUser = role === 'HEAD' ? {
      uid: 'demo-head-001',
      email: 'chairman.railboard@gov.in',
      displayName: 'Shri Amitabh Sharma',
      role: 'HEAD',
      assignedZone: 'ALL',
      designation: 'Member (Operations & Business Development) / CEO Railway Board',
      sectionName: 'Apex Rail Bhavan Operations Center, New Delhi',
      createdAt: new Date().toISOString()
    } : {
      uid: `demo-operator-${zone.toLowerCase()}`,
      email: `controller.${zone.toLowerCase()}@railnet.gov.in`,
      displayName: `Rajesh Verma (${zone} Division)`,
      role: 'OPERATOR',
      assignedZone: zone,
      designation: 'Chief Section Controller / AI Dispatcher',
      sectionName: `${zone} - High Density Freight & Passenger Corridor Desk`,
      createdAt: new Date().toISOString()
    };

    setUser(demoUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoUser));
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const switchZone = (zone: string) => {
    if (!user) return;
    const updated: RailwayUser = {
      ...user,
      assignedZone: zone
    };
    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const isHead = user?.role === 'HEAD';
  const isOperator = user?.role === 'OPERATOR';
  const activeZone = user?.assignedZone || 'ALL';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginDemoUser,
        logout,
        switchZone,
        isHead,
        isOperator,
        activeZone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
