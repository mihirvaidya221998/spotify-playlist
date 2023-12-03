import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './firebase-config';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import './user.css';

const fetchUserData = async (userID) => {
  try {
    const userRef = doc(db, 'Users', userID);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      const playlistsRef = collection(db, 'Playlist');
      const userPlaylistsQuery = query(playlistsRef, where('user_id', '==', userID));
      const playlistsSnapshot = await getDocs(userPlaylistsQuery);
      const userPlaylists = playlistsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      return { ...userData, playlists: userPlaylists };
    } else {
      console.error('User document not found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

function UserPlaylist() {
  const { userID } = useParams();
  const [userData, setUserData] = useState(null);
  const [newName, setNewName] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [genre, setGenre] = useState('');
  const [subgenre, setSubgenre] = useState('');
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [trackSearchResults, setTrackSearchResults] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [showCreatePlaylistForm, setShowCreatePlaylistForm] = useState(false);
  const [showNameChangeForm, setShowNameChangeForm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await fetchUserData(userID);
      setUserData(user);
    };

    fetchUser();
  }, [userID]);

  const handleTrackSearch = async (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setTrackSearchQuery(searchTerm);
  
    if (!searchTerm.trim()) {
      setTrackSearchResults([]);
      return;
    }
  
    // Firestore does not support native case-insensitive search, so this is a limitation
    // We will fetch all tracks and filter them on the client-side (not efficient for large datasets)
    const tracksRef = collection(db, 'Tracks');
    const querySnapshot = await getDocs(tracksRef);
  
    const tracks = [];
    querySnapshot.forEach((doc) => {
      const trackData = doc.data();
      if (
        trackData.name.toLowerCase().includes(searchTerm) ||
        trackData.artist_name.toLowerCase().includes(searchTerm)
      ) {
        tracks.push({
          id: doc.id,
          ...trackData,
        });
      }
    });
  
    setTrackSearchResults(tracks);
  };
  

  const handleSelectTrack = (track) => {
    if (!selectedTracks.find((t) => t.id === track.id)) {
      setSelectedTracks([...selectedTracks, track]);
    }
  };

  const handleCreatePlaylistFormSubmit = async (event) => {
    event.preventDefault();
    if (!playlistName || !genre || !subgenre || selectedTracks.length === 0) {
      alert('Please fill all the fields and add at least one track.');
      return;
    }
  
    // Start by creating the new playlist document
    const playlistRef = collection(db, 'Playlist');
    const newPlaylistDocRef = await addDoc(playlistRef, {
      name: playlistName,
      genre: genre,
      subgenre: subgenre,
      playlist_tracks: selectedTracks.map((track) => track.id),
      user_id: userID,
    });
  
    // Get the new playlist ID
    const newPlaylistID = newPlaylistDocRef.id;
  
    // Update the user's document to include the new playlist ID
    const userRef = doc(db, 'Users', userID);
    await updateDoc(userRef, {
      playlists: [...(userData.playlists || []), newPlaylistID],
    });
  
    // Fetch updated user data to update the state
    const updatedUser = await fetchUserData(userID);
    setUserData(updatedUser);
  
    // Reset the form fields and close the form
    setPlaylistName('');
    setGenre('');
    setSubgenre('');
    setSelectedTracks([]);
    setShowCreatePlaylistForm(false);
    alert('Playlist created successfully!');
  };
  

  const updateUserName = async () => {
    const userRef = doc(db, 'Users', userID);
    await updateDoc(userRef, { user_name: newName });
    const updatedUser = await fetchUserData(userID);
    setUserData(updatedUser);
    setNewName('');
  };

  const handleNameChange = (event) => {
    event.preventDefault();
    updateUserName();
  };

  return (
    <div className="container">
      {userData ? (
        <>
          <h1>{userData.user_name}'s Playlists</h1>
          <p>Email: {userData.email}</p>
          <p>ID: {userData.id}</p>
          <p>Playlists:
            <ul>
              {userData.playlists.map((playlist) => (
                <li key={playlist.id}>{playlist.name}</li>
              ))}
            </ul>
          </p>
          {/* Toggle Name Change Form */}
          <button onClick={() => setShowNameChangeForm(!showNameChangeForm)}>
            {showNameChangeForm ? 'Hide Name Change Form' : 'Change Name'}
          </button>
          {showNameChangeForm && (
          <form onSubmit={handleNameChange}>
            <label>
              New User Name:
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </label>
            <button type="submit">Change Name</button>
          </form>
          )}

          <button onClick={() => setShowCreatePlaylistForm(!showCreatePlaylistForm)}>
            {showCreatePlaylistForm ? 'Hide Create Playlist Form' : 'Create Playlist'}
          </button>

          {showCreatePlaylistForm && (
            <form onSubmit={handleCreatePlaylistFormSubmit}>
              <h2>Create Playlist</h2>
              <label>
                Playlist Name:
                <input type="text" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} />
              </label>
              <label>
                Genre:
                <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} />
              </label>
              <label>
                Subgenre:
                <input type="text" value={subgenre} onChange={(e) => setSubgenre(e.target.value)} />
              </label>
              <label>
                Search Tracks:
                <input type="text" value={trackSearchQuery} onChange={handleTrackSearch} />
              </label>
              <div className="track-search-results">
                {trackSearchResults.map((track) => (
                  <div key={track.id} onClick={() => handleSelectTrack(track)}>
                    {track.name}
                  </div>
                ))}
              </div>
              <div>
                <h3>Selected Tracks</h3>
                {selectedTracks.map((track, index) => (
                  <div key={index}>{track.name}</div>
                ))}
              </div>
              <button type="submit">Create Playlist</button>
            </form>
          )}
        </>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
}

export default UserPlaylist;
