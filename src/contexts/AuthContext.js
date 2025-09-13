import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from users collection
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          // Fetch operator data from operators collection
          const operatorDoc = await getDoc(doc(db, 'operators', firebaseUser.uid));
          let operatorData = {};
          
          if (operatorDoc.exists()) {
            operatorData = operatorDoc.data();
          } else {
            // Create default operator document if it doesn't exist
            operatorData = {
              name: '',
              contact: '',
              email: firebaseUser.email || ''
            };
            // Create the document in Firestore
            await setDoc(doc(db, 'operators', firebaseUser.uid), operatorData);
          }
          
          const combinedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userData,
            ...operatorData
          };
          
          setUser(combinedUser);
        } catch (error) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        const operatorDoc = await getDoc(doc(db, 'operators', auth.currentUser.uid));
        const operatorData = operatorDoc.exists() ? operatorDoc.data() : {};
        
        const combinedUser = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          ...userData,
          ...operatorData
        };
        
        setUser(combinedUser);
      } catch (error) {
        // Silent error handling
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
