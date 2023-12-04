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
  addDoc,
  deleteDoc
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editablePlaylist, setEditablePlaylist] = useState(null);
  const [editTrackSearchQuery, setEditTrackSearchQuery] = useState('');
  const [editTrackSearchResults, setEditTrackSearchResults] = useState([]);



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
  
    // Create an object representing the new playlist to add to the user's playlists array
    const newPlaylistObject = {
      id: newPlaylistID,
      name: playlistName,    // The name of the playlist
      genre: genre,         // The genre of the playlist
      subgenre: subgenre,   // The subgenre of the playlist
      playlist_tracks: selectedTracks.map((track) => track.id), // IDs of the tracks in the playlist
      user_id: userID
    };
  
    // Update the user's document to include the new playlist
    const userRef = doc(db, 'Users', userID);
    await updateDoc(userRef, {
      playlists: [...(userData.playlists || []), newPlaylistObject],
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

  const handleEditPlaylist = async (playlist) => {
    setIsEditMode(true);
    const trackDetails = await fetchTrackDetails(playlist.playlist_tracks);
    setEditablePlaylist({ ...playlist, playlist_tracks: trackDetails });
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
  
    try {
      // Extract only the track IDs to update the Firestore document
      const trackIds = editablePlaylist.playlist_tracks.map(track => track.id);
  
      // Prepare the updated playlist data
      const updatedPlaylistData = {
        ...editablePlaylist,
        playlist_tracks: trackIds  // Updating with only track IDs
      };
  
      // Remove fields that should not be saved to the Playlist collection
      delete updatedPlaylistData.id;
  
      // Update the playlist in the Playlist collection
      const playlistRef = doc(db, 'Playlist', editablePlaylist.id);
      await updateDoc(playlistRef, updatedPlaylistData);
      
      // Update the playlist details in the user's playlists array
      const userRef = doc(db, 'Users', userID);
      const userData = (await getDoc(userRef)).data();
      const updatedUserPlaylists = userData.playlists.map(p => 
        p.id === editablePlaylist.id ? { ...p, ...updatedPlaylistData } : p
      );
      await updateDoc(userRef, { playlists: updatedUserPlaylists });
      
      // Fetch and update the user data to reflect changes in the local state
      const updatedUser = await fetchUserData(userID);
      setUserData(updatedUser);
      
      // Notify the user of success, reset edit state and close the form
      alert('Playlist updated successfully!');
      setIsEditMode(false);
      setEditablePlaylist(null);
  
    } catch (error) {
      console.error("Error updating playlist: ", error);
      alert("An error occurred while saving changes. Please try again.");
    }
  };
  
  
      const handleDeletePlaylist = async (playlistId) => {
        // Confirm before deletion
        if (!window.confirm("Are you sure you want to delete this playlist?")) {
          return;
        }
      
        try {
          // Delete the playlist from the Playlist collection
          const playlistRef = doc(db, 'Playlist', playlistId);
          await deleteDoc(playlistRef);
          
          // Remove the playlist from the user's playlists array
          const userRef = doc(db, 'Users', userID);
          const userData = (await getDoc(userRef)).data();
          const updatedPlaylists = userData.playlists.filter(p => p.id !== playlistId);
          await updateDoc(userRef, { playlists: updatedPlaylists });
          
          // Update local state to reflect the changes
          const newUserData = { ...userData, playlists: updatedPlaylists };
          setUserData(newUserData);
      
        } catch (error) {
          console.error("Error deleting playlist: ", error);
          alert("An error occurred while deleting the playlist. Please try again.");
        }
      
        // Exit edit mode
        setIsEditMode(false);
        setEditablePlaylist(null);
      };

              // Handler for updating the editable playlist's name
        const handlePlaylistNameChange = (event) => {
          setEditablePlaylist((prevPlaylist) => ({
            ...prevPlaylist,
            name: event.target.value,
          }));
        };

        // Handler for updating the editable playlist's genre
        const handlePlaylistGenreChange = (event) => {
          setEditablePlaylist((prevPlaylist) => ({
            ...prevPlaylist,
            genre: event.target.value,
          }));
        };

        // Handler for updating the editable playlist's subgenre
        const handlePlaylistSubgenreChange = (event) => {
          setEditablePlaylist((prevPlaylist) => ({
            ...prevPlaylist,
            subgenre: event.target.value,
          }));
        };
        const handleEditTrackSearch = async (event) => {
            const searchTerm = event.target.value.toLowerCase();
            setEditTrackSearchQuery(searchTerm);
          
            if (!searchTerm.trim()) {
              setEditTrackSearchResults([]);
              return;
            }
          
            const tracksRef = collection(db, 'Tracks');
            const querySnapshot = await getDocs(tracksRef);
          
            const tracks = [];
            querySnapshot.forEach((doc) => {
              const trackData = doc.data();
              if (
                trackData.name.toLowerCase().includes(searchTerm) ||
                (trackData.artist_name && trackData.artist_name.toLowerCase().includes(searchTerm))
              ) {
                tracks.push({
                  id: doc.id,
                  ...trackData,
                });
              }
            });
          
            setEditTrackSearchResults(tracks);
          };
        
          const handleAddTrackToEditablePlaylist = (track) => {
            setEditablePlaylist((prevPlaylist) => ({
              ...prevPlaylist,
              playlist_tracks: [...prevPlaylist.playlist_tracks, track],
            }));
          };
          
          const handleRemoveTrackFromEditablePlaylist = (trackId) => {
            setEditablePlaylist((prevPlaylist) => ({
              ...prevPlaylist,
              playlist_tracks: prevPlaylist.playlist_tracks.filter((track) => track.id !== trackId),
            }));
          };
          

        const fetchTrackDetails = async (trackIds) => {
          const tracksRef = collection(db, 'Tracks');
          const trackDetails = [];
        
          for (const id of trackIds) {
            const trackRef = doc(tracksRef, id);
            const trackSnapshot = await getDoc(trackRef);
            if (trackSnapshot.exists()) {
              trackDetails.push({ id, ...trackSnapshot.data() });
            }
          }
        
          return trackDetails;
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
                <li key={playlist.id} onClick={() => handleEditPlaylist(playlist)}>{playlist.name}</li>
              ))}
            </ul>
          </p>
          {isEditMode && editablePlaylist && (
            <div>
              <h2>Edit Playlist</h2>
              <form onSubmit={handleSaveChanges}>
              <label>
                  Playlist Name:
                  <input
                    type="text"
                    value={editablePlaylist.name}
                    onChange={handlePlaylistNameChange}
                  />
                </label>
                <label>
                  Genre:
                  <input
                    type="text"
                    value={editablePlaylist.genre}
                    onChange={handlePlaylistGenreChange}
                  />
                </label>
                <label>
                  Subgenre:
                  <input
                    type="text"
                    value={editablePlaylist.subgenre}
                    onChange={handlePlaylistSubgenreChange}
                  />
                </label>
                <label>
                    Search Tracks to Add:
                    <input
                      type="text"
                      value={editTrackSearchQuery}
                      onChange={handleEditTrackSearch}
                    />
                  </label>
                  {editTrackSearchResults.map((track) => (
                    <div key={track.id} onClick={() => handleAddTrackToEditablePlaylist(track)}>
                      {track.name}
                    </div>
                  ))}
                  <h3>Current Tracks</h3>
                  <ul>
                    {editablePlaylist.playlist_tracks.map((track) => (
                      <li key={track.id}>
                        {track.name} - {track.artist_name}
                        <button type="button" onClick={() => handleRemoveTrackFromEditablePlaylist(track.id)}>
                          Delete Track
                        </button>
                      </li>
                    ))}
                  </ul>
                <button type="submit">Save Changes</button>
                <button onClick={() => handleDeletePlaylist(editablePlaylist.id)}>Delete Playlist</button>
              </form>
            </div>
          )}
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
