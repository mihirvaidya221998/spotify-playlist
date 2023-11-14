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

// Function to parse CSV and organize data 
const parseAndUploadCSV = () => {
  // Replace with the path to your CSV file in the public folder
  const csvFilePath = process.env.PUBLIC_URL + '/data/spotify_songs_small.csv'; 

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
        //     "artist_id": "unique_artist_id" // Foreign key referencing Artist
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
      console.log("printing tracks",tracks.length);
      console.log("printing albums",albums.length);
      console.log("printing playlists",playlists.length);

    //   Upload data to Firestore
    //  uploadDataToFirestore(tracks, "Track");
    //   uploadDataToFirestore(albums, "Album");
    //   uploadDataToFirestore(playlists, "Playlist");
    }
  });
};

export default parseAndUploadCSV;
