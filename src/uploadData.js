import Papa from 'papaparse';
import { db } from './firebase-config';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';


// Function to upload data to Firestore
const uploadDataToFirestore = async (data, collectionName) => {
    data.forEach(async item => {
      const docRef = doc(db, collectionName, item.id);
      await setDoc(docRef, item)
        .then(() => console.log(`Document written in ${collectionName}`))
        .catch((error) => console.error("Error adding document: ", error));
    });
  };


  const generateRandomUsers = (count) => {
    const users = [];
    for (let i = 1; i <= count; i++) {
      users.push({
        id: `user_${i}`, // Changed from user_id to id
        user_name: `User Name ${i}`,
        email: `user${i}@example.com`,
        created_at: new Date().toISOString()
      });
    }
    return users;
  };
  
  
  const generateAdditionalPlaylists = (users, tracks, count) => {
    const newPlaylists = [];
    const genresAndSubgenres = [
      "Trap", "Techno", "Techhouse", "Trance", "Psytrance", 
      "Dark Trap", "DnB", "Hardstyle", "Underground Rap", 
      "Trap Metal", "Emo", "Rap", "RnB", "Pop", "Hiphop"
    ];
    for (let i = 1; i <= count; i++) {
      const randomUserId = users[Math.floor(Math.random() * users.length)].user_id;
      const playlistTracks = [];
      const numberOfTracks = Math.floor(Math.random() * 6) + 5; // 5 to 10 tracks
      for (let j = 0; j < numberOfTracks; j++) {
        const randomTrackId = tracks[Math.floor(Math.random() * tracks.length)].id;
        playlistTracks.push(randomTrackId);
      }

        // Randomly select genre and subgenre
      const randomGenreIndex = Math.floor(Math.random() * genresAndSubgenres.length);
      const randomSubgenreIndex = Math.floor(Math.random() * genresAndSubgenres.length);
  
      newPlaylists.push({
        id: `playlist_${i}`,
        name: `Playlist ${i}`,
        genre: genresAndSubgenres[randomGenreIndex],
        subgenre: genresAndSubgenres[randomSubgenreIndex], 
        user_id: randomUserId,
        playlist_tracks: playlistTracks
      });
    }
    return newPlaylists;
  };

// Function to parse CSV and organize data 
const parseAndUploadCSV = () => {
  // Replace with the path to your CSV file in the public folder
  const csvFilePath = process.env.PUBLIC_URL + '/data/spotify_songs_small.csv'; 
  const users = generateRandomUsers(15); // Generate 15 user entries
  

  Papa.parse(csvFilePath, {
    download: true,
    header: true,
    complete: function(results) {
      const tracks = [];
      const albums = [];
      const playlists = [];
      const playlistTracks = {};
      // Add other arrays for different collections as needed


      results.data.forEach((row) => { 
       
        tracks.push({
            id: row.track_id,
            name: row.track_name,
            artist_name: row.track_artist, 
            popularity: row.track_popularity,
            album_id: row.track_album_id, 
            features: {
              danceability: parseFloat(row.danceability),
              energy: parseFloat(row.energy),
              speechiness: parseFloat(row.speechiness),
              acousticness: parseFloat(row.acousticness),
              instrumentalness: parseFloat(row.instrumentalness),
              liveness: parseFloat(row.liveness),
              valence: parseFloat(row.valence),
              key: parseInt(row.key, 10),
              loudness: parseFloat(row.loudness),
              mode: parseInt(row.mode, 10),
              tempo: parseFloat(row.tempo),
              duration_ms: parseInt(row.duration_ms, 10)
            }
          });

        // For albums:
        if (!albums.some(album => album.id === row.track_album_id)) {
          albums.push({
            id: row.track_album_id,
            name: row.track_album_name,
            release_date: row.track_album_release_date
          });
        }

        // For playlists:
        if (!playlists.some(playlist => playlist.id === row.playlist_id)) {
          playlists.push({
            id: row.playlist_id,
            name: row.playlist_name,
            genre: row.playlist_genre,
            subgenre: row.playlist_subgenre,
            user_id: "Spotify" //Default user_id is spotify, for playlists already present
          });
          playlistTracks[row.playlist_id] = []; // Initialize an array for this playlist
        }
        if (row.track_id && playlistTracks[row.playlist_id].indexOf(row.track_id) === -1) {
          playlistTracks[row.playlist_id].push(row.track_id);
        }

        ///json format for reference

        //   {
        //   "User": {
        //     "user_id": "unique_user_id",
        //     "user_name": "user_name",
        //     "email": "user_email@example.com",
        //     "created_at": "timestamp"
        //   },
        //   "Playlist": {
        //     "playlist_id": "unique_playlist_id",
        //     "playlist_name": "playlist_name",
        //     "playlist_genre": "playlist_genre",
        //     "playlist_subgenre": "playlist_subgenre",
        //     "playlist_tracks" :
        //     "user_id": "unique_user_id" // Foreign key referencing User
        //   },
        //   "Track": {
        //     "track_id": "unique_track_id",
        //     "track_name": "track_name",
        //     "track_popularity": 85,
        //     "features": {
        //       "danceability": 0.8,
        //       "energy": 0.9,
        //       "speechiness": 0.1,
        //       "acousticness": 0.3,
        //       "instrumentalness": 0.0,
        //       "liveness": 0.2,
        //       "valence": 0.6,
        //       "key": 5,
        //       "loudness": -5.2,
        //       "mode": 1,
        //       "tempo": 120.0,
        //       "duration_ms": 210000
        //     },
        //     "album_id": "unique_album_id", // Foreign key referencing Album
        //   },
        //   "Album": {
        //     "album_id": "unique_album_id",
        //     "album_name": "album_name",
        //     "album_release_date": "release_date",
        //   }
        // }

        
      }); 
      // Append the playlist_tracks to each playlist before uploading 
      playlists.forEach(playlist => {
        playlist.playlist_tracks = playlistTracks[playlist.id];
      });


      const additionalPlaylists = generateAdditionalPlaylists(users, tracks, 15);
      playlists.push(...additionalPlaylists); // Add new playlists to the existing array

      console.log("printing tracks",tracks.length);
      console.log("printing albums",albums.length);
      console.log("printing playlists",playlists.length);
      console.log("printing users",users.length)

    //   Upload data to Firestore
      uploadDataToFirestore(users, "Users"); // Upload users to Firestore
      uploadDataToFirestore(tracks, "Tracks");
      uploadDataToFirestore(albums, "Album");
      uploadDataToFirestore(playlists, "Playlist");
    }
  });
};

export default parseAndUploadCSV;
