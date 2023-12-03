import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './firebase-config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import './user.css';

const fetchUserData = async (userID) => {
    try {
      // Reference to the user document in Firestore
      const userRef = doc(db, 'Users', userID);
  
      // Fetch the document
      const userSnapshot = await getDoc(userRef);
  
      // Check if the document exists
      if (userSnapshot.exists()) {
        // Extract the data from the document
        const userData = userSnapshot.data();

        const playlistsRef = collection(db, 'Playlist');
        const userPlaylistsQuery = query(
            playlistsRef,
            where('user_id', '==', userID)
        );

        const playlistsSnapshot = await getDocs(userPlaylistsQuery);
        const userPlaylists = playlistsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          return { ...userData, playlists: userPlaylists };
      } else {
        // Handle the case where the user document does not exist
        console.error('User document not found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error; // You might want to handle the error in your component
    }
  };

function UserPlaylist() {
  const { userID } = useParams();
  const [userData, setUserData] = useState(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchField, setShowSearchField] = useState(false);
  const [showCreatePlaylistForm, setShowCreatePlaylistForm] = useState(false);
  const [playlistName, setPlaylistName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
        const user = await fetchUserData(userID);
        setUserData(user);
    };
    fetchUser();
  }, [userID]);

  const updateUserName = async () => {
    try {
      const userRef = doc(db, 'Users', userID);

      // Update the user name field
      await updateDoc(userRef, {
        user_name: newName,
      });

      // Fetch updated user data
      const updatedUser = await fetchUserData(userID);
      setUserData(updatedUser);
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  };

  const handleNameChange = async (event) => {
    event.preventDefault();
    updateUserName();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const searchPlaylists = async () => {
    try {
      const playlistsRef = collection(db, 'Playlist');
      const searchResultsQuery = query(
        playlistsRef,
        where('name', '==', searchQuery)
      );

      const resultsSnapshot = await getDocs(searchResultsQuery);
      const results = resultsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching playlists:', error);
    }
  };
  const addPlaylistToUser = async (playlistId) => {
    try {
        const playlistsRef = collection(db, 'Playlist');
    
        // Add the new playlist to the collection
        const newPlaylistDocRef = await addDoc(playlistsRef, {
          name: playlistName,
          user_id: userID,
          // Add other playlist details as needed
        });
    
        // Get the ID of the newly created playlist document
        const newPlaylistID = newPlaylistDocRef.id;
    
        // Update the user's playlists with the new playlist ID
        const userRef = doc(db, 'Users', userID);
        const userPlaylistsField = 'playlists'; // Adjust this field based on your schema
    
        await updateDoc(userRef, {
          [userPlaylistsField]: [...userData.playlists, newPlaylistID],
        });
    
        // Fetch updated user data
        const updatedUser = await fetchUserData(userID);
        setUserData(updatedUser);
      } catch (error) {
        console.error('Error adding playlist to user:', error);
      }
  };

  const handleCreatePlaylistFormSubmit = async (event) => {
    event.preventDefault();
  try {
    const playlistsRef = collection(db, 'Playlist');
    const newPlaylistDocRef = await addDoc(playlistsRef, {
      name: playlistName,
      user_id: userID,
    });

    // Get the ID of the newly created playlist document
    const newPlaylistID = newPlaylistDocRef.id;

    // Update the user's playlists with the new playlist ID
    const userRef = doc(db, 'Users', userID);
    const userPlaylistsField = 'playlists'; // Adjust this field based on your schema

    await updateDoc(userRef, {
      [userPlaylistsField]: [...userData.playlists, newPlaylistID],
    });

    // Fetch updated user data
    const updatedUser = await fetchUserData(userID);
    setUserData(updatedUser);
  } catch (error) {
    console.error('Error creating playlist:', error);
  }
  };


  return (
    <div className="container">
      {userData ? (
        <>
          <h1>{userData.user_name}'s Playlist</h1>
          <p>Email: {userData.email}</p>
          <p>ID: {userData.id}</p>

          <form onSubmit={handleNameChange}>
            <label>
              New User Name:
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            <button type="submit">Change Name</button>
          </form>

          <div>
            <button onClick={() => setShowSearchField(!showSearchField)}>
              {showSearchField ? 'Hide Search' : 'Show Search'}
            </button>

            {showSearchField && (
              <>
                <h2>Search Playlist</h2>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <button onClick={searchPlaylists}>Search</button>

                <ul>
                  {searchResults.map((playlist) => (
                    <li key={playlist.id}>
                      {playlist.name}
                      <button onClick={() => addPlaylistToUser(playlist.id)}>
                        Add to My Playlists
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button onClick={() => setShowCreatePlaylistForm(!showCreatePlaylistForm)}>
              {showCreatePlaylistForm ? 'Hide Create Playlist Form' : 'Create Playlist'}
            </button>

            {showCreatePlaylistForm && (
              <form onSubmit={handleCreatePlaylistFormSubmit}>
                <h2>Create Playlist</h2>
                <label>
                  Playlist Name:
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                  />
                </label>
                {/* Add search field for songs and logic to add songs to the playlist */}
                <button type="submit">Create Playlist</button>
              </form>
            )}
          </div>

          <ul>
            {userData.playlists.map((playlist) => (
              <li key={playlist.id}>{playlist.name}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
}

export default UserPlaylist;