//firebase imports
import { db } from './firebase-config';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';

import React, { useEffect, useState } from 'react';
import './playlists.css';


function Playlists() {
    const [playlists, setPlaylists] = useState([]);
    const [users, setUsers] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [albums, setAlbums] = useState([]);
  
    useEffect(() => {
      const fetchPlaylists = async () => {
        const querySnapshot = await getDocs(collection(db, "Playlist"));
        setPlaylists(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      };
  
      const fetchUsers = async () => {
        const querySnapshot = await getDocs(collection(db, "Users"));
        setUsers(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      };
      const fetchTracks = async () => {
        const querySnapshot = await getDocs(collection(db, "Tracks"));
        setTracks(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      };
      const fetchAlbums = async () => {
        const querySnapshot = await getDocs(collection(db, "Album"));
        setAlbums(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      };
  
      fetchPlaylists();
      fetchUsers();
      fetchTracks();
      fetchAlbums();
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
            <div className="list">
              <h2>Tracks</h2>
                {tracks.map(track => (
                <div key={track.id}>{track.name}</div>
                ))}
            </div>
            <div className="list">
              <h2>Albums</h2>
                {albums.map(album => (
                <div key={album.id}>{album.name}</div>
                ))}
            </div>
          </div>
        </div>
      );
  }
  
  export default Playlists;