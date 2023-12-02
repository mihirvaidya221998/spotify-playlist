//firebase imports
import { db } from './firebase-config';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';

import React, { useEffect, useState } from 'react';
import './playlists.css';


function Playlists() {
    const [playlists, setPlaylists] = useState([]);
    const [users, setUsers] = useState([]);
  
    useEffect(() => {
      const fetchPlaylists = async () => {
        const querySnapshot = await getDocs(collection(db, "Playlist"));
        setPlaylists(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      };
  
      const fetchUsers = async () => {
        const querySnapshot = await getDocs(collection(db, "Users"));
        setUsers(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      };
  
      fetchPlaylists();
      fetchUsers();
    }, []);
  
    // Render playlists and users
    return (
        <div className="Playlists">
          <h1>All data available</h1>
          <div className="content">
            <div className="list">
              <h2>Playlists</h2>
              {playlists.map(playlist => (
                <div key={playlist.id}>{playlist.name}</div>
              ))}
            </div>
            <div className="list">
              <h2>Users</h2>
              {users.map(user => (
                <div key={user.id}>{user.user_name}</div>
              ))}
            </div>
          </div>
        </div>
      );
  }
  
  export default Playlists;