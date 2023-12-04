// visualization.js
import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-config';
import './visualization.css'; // Import the CSS file

const Visualization = () => {
  const danceabilityChartRef = useRef(null);
  const energyChartRef = useRef(null);
  const artistPopularityChartRef = useRef(null);
  const userPlaylistsChartRef = useRef(null);

  const [danceabilityData, setDanceabilityData] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [artistPopularityData, setArtistPopularityData] = useState([]);
  const [userPlaylistsData, setUserPlaylistsData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tracksRef = collection(db, 'Tracks');
        const tracksSnapshot = await getDocs(tracksRef);
        const tracksData = tracksSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Group tracks by artist_name and calculate average danceability, energy, and popularity
        const aggregatedData = tracksData.reduce((acc, track) => {
          const { artist_name, features, popularity } = track;
          const danceability = features?.danceability || 0;
          const energy = features?.energy || 0;

          if (!acc[artist_name]) {
            acc[artist_name] = {
              totalDanceability: 0,
              totalEnergy: 0,
              trackCount: 0,
              totalPopularity: 0,
            };
          }

          acc[artist_name].totalDanceability += danceability;
          acc[artist_name].totalEnergy += energy;
          acc[artist_name].trackCount += 1;
          acc[artist_name].totalPopularity += parseInt(popularity, 10);

          return acc;
        }, {});

        // Calculate average danceability, energy, and total popularity for each artist
        const danceabilityData = Object.entries(aggregatedData).map(
          ([artist_name, { totalDanceability, trackCount }]) => ({
            artist_name,
            averageDanceability: totalDanceability / trackCount,
          })
        );

        const energyData = Object.entries(aggregatedData).map(
          ([artist_name, { totalEnergy, trackCount }]) => ({
            artist_name,
            averageEnergy: totalEnergy / trackCount,
          })
        );

        const artistPopularityData = Object.entries(aggregatedData).map(
          ([artist_name, { totalPopularity }]) => ({
            artist_name,
            totalPopularity,
          })
        );

        setDanceabilityData(danceabilityData);
        setEnergyData(energyData);
        setArtistPopularityData(artistPopularityData);

        // Fetch user data and calculate playlist information
        const usersRef = collection(db, 'Users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map((doc) => doc.data());

        const userPlaylistsData = usersData.map((user) => {
          const { user_name, playlists } = user;
          console.log('user name: ',user_name);
          

          // Calculate the number of playlists for each user
          const playlistCount = playlists ? playlists.length : 0;


          return {
            user_name,
            playlistCount,
          };
        });

        // Sort users based on playlist count in descending order
        userPlaylistsData.sort((a, b) => b.playlistCount - a.playlistCount);

        // Show the top 5 users and summarize the rest
        const top5Users = userPlaylistsData.slice(0, 5);
        const restUsersCount = userPlaylistsData.slice(5).reduce((acc, user) => acc + user.playlistCount, 0);

        setUserPlaylistsData([...top5Users, { user_name: 'Others', playlistCount: restUsersCount }]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (danceabilityChartRef.current && danceabilityData.length > 0) {
      // Create a visualization using Chart.js for danceability data
      const ctx = danceabilityChartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'bar', // Adjust chart type as needed
        data: {
          labels: danceabilityData.map((data) => data.artist_name),
          datasets: [
            {
              label: 'Average Danceability',
              data: danceabilityData.map((data) => data.averageDanceability),
              backgroundColor: 'rgba(75, 192, 192, 0.2)', // Adjust color as needed
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [danceabilityData]);

  useEffect(() => {
    if (energyChartRef.current && energyData.length > 0) {
      // Create a visualization using Chart.js for energy data
      const ctx = energyChartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'bar', // Adjust chart type as needed
        data: {
          labels: energyData.map((data) => data.artist_name),
          datasets: [
            {
              label: 'Average Energy',
              data: energyData.map((data) => data.averageEnergy),
              backgroundColor: 'rgba(255, 99, 132, 0.2)', // Adjust color as needed
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [energyData]);

  useEffect(() => {
    if (artistPopularityChartRef.current && artistPopularityData.length > 0) {
      // Create a visualization using Chart.js for artist popularity data
      const ctx = artistPopularityChartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'bar', // Adjust chart type as needed
        data: {
          labels: artistPopularityData.map((data) => data.artist_name),
          datasets: [
            {
              label: 'Total Popularity',
              data: artistPopularityData.map((data) => data.totalPopularity),
              backgroundColor: 'rgba(75, 192, 192, 0.2)', // Adjust color as needed
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [artistPopularityData]);

  useEffect(() => {
    if (userPlaylistsChartRef.current && userPlaylistsData.length > 0) {
      // Create a visualization using Chart.js for user playlists data
      const ctx = userPlaylistsChartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'bar', // Adjust chart type as needed
        data: {
          labels: userPlaylistsData.map((data) => data.user_name),
          datasets: [
            {
              label: 'Playlist Count',
              data: userPlaylistsData.map((data) => data.playlistCount),
              backgroundColor: 'rgba(127, 195, 67, 0.2)', // Adjust color as needed
              borderColor: 'rgba(127, 195, 67, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [userPlaylistsData]);

  return (
    <div className='chart-container'>
      <canvas ref={danceabilityChartRef} className="chart" />
      <canvas ref={energyChartRef} className="chart" />
      <canvas ref={artistPopularityChartRef} className="chart" />
      <canvas ref={userPlaylistsChartRef} className="chart" />
    </div>
  );
};

export default Visualization;
