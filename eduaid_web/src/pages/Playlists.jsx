import React, { useState, useEffect } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import stars from "../assets/stars.png";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FaPlus, FaPlay, FaTrash } from "react-icons/fa";

const Playlists = () => {
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get("/playlists");
            if (response.success) {
                setPlaylists(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch playlists:", err);
            setError("Failed to load playlists");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) {
            setError("Playlist name cannot be empty");
            return;
        }

        try {
            const response = await apiClient.post("/playlists", {
                name: newPlaylistName,
            });

            if (response.success) {
                setPlaylists([...playlists, response.data]);
                setNewPlaylistName("");
                setShowCreateModal(false);
                setError("");
            }
        } catch (err) {
            console.error("Failed to create playlist:", err);
            setError("Failed to create playlist");
        }
    };

    const handleDeletePlaylist = async (playlistId, e) => {
        e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this playlist?")) {
            return;
        }

        try {
            const response = await apiClient.makeRequest(`/playlists/${playlistId}`, {
                method: "DELETE",
            });

            if (response.success) {
                setPlaylists(playlists.filter((p) => p.id !== playlistId));
            }
        } catch (err) {
            console.error("Failed to delete playlist:", err);
            setError("Failed to delete playlist");
        }
    };

    const handlePlaylistClick = (playlist) => {
        if (playlist.quizzes.length === 0) {
            alert("This playlist is empty. Add some quizzes first!");
            return;
        }
        navigate(`/playlist-player/${playlist.id}`);
    };

    return (
        <div className="w-screen h-screen bg-[#02000F] flex flex-col justify-center items-center">
            <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient p-4 md:p-6 overflow-y-auto">
                {/* Header */}
                <Link to="/" className="flex items-end gap-2">
                    <img src={logoPNG} alt="logo" className="w-14 md:w-16" />
                    <div className="text-xl md:text-2xl font-extrabold">
                        <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                            Edu
                        </span>
                        <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                            Aid
                        </span>
                    </div>
                </Link>

                {/* Title */}
                <div className="mt-3 text-center">
                    <div className="text-white flex justify-center gap-2 text-lg md:text-2xl font-bold items-center">
                        Your{" "}
                        <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                            Quiz Playlists
                        </span>
                        <img className="h-4 w-4 md:h-5 md:w-5" src={stars} alt="stars" />
                    </div>
                </div>

                {/* Create Playlist Button */}
                <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#7C3AED] hover:bg-[#5A2AD9] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        <FaPlus /> Create New Playlist
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-center text-red-400 mt-4">{error}</div>
                )}

                {/* Playlists Grid */}
                <div className="mx-auto max-w-6xl mt-6">
                    {loading ? (
                        <div className="text-center text-white">Loading playlists...</div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center text-white text-lg">
                            No playlists yet. Create your first playlist!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {playlists.map((playlist) => (
                                <div
                                    key={playlist.id}
                                    className="bg-[#202838] p-6 rounded-lg border-2 border-[#7600F2] cursor-pointer hover:bg-[#2a3348] transition-colors"
                                    onClick={() => handlePlaylistClick(playlist)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-white font-bold text-lg">
                                            {playlist.name}
                                        </h3>
                                        <button
                                            onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>

                                    <div className="text-gray-400 text-sm mb-4">
                                        {playlist.quizzes.length} quiz{playlist.quizzes.length !== 1 ? "zes" : ""}
                                    </div>

                                    <div className="text-gray-500 text-xs">
                                        Created: {new Date(playlist.created_at).toLocaleDateString()}
                                    </div>

                                    {playlist.quizzes.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlaylistClick(playlist);
                                            }}
                                            className="mt-4 w-full bg-[#518E8E] hover:bg-[#3a6b6b] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaPlay size={14} /> Start Playlist
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <div className="flex justify-center mt-6">
                    <Link to="/">
                        <button className="bg-black text-white px-6 py-2 border-gradient">
                            Back to Home
                        </button>
                    </Link>
                </div>
            </div>

            {/* Create Playlist Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#202838] p-6 rounded-lg max-w-md w-full mx-4">
                        <h2 className="text-white text-xl font-bold mb-4">
                            Create New Playlist
                        </h2>

                        <input
                            type="text"
                            placeholder="Enter playlist name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="w-full bg-[#1a1a2e] text-white p-3 rounded border border-gray-600 focus:border-[#7600F2] focus:outline-none mb-4"
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleCreatePlaylist();
                                }
                            }}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleCreatePlaylist}
                                className="flex-1 bg-[#7C3AED] hover:bg-[#5A2AD9] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewPlaylistName("");
                                    setError("");
                                }}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Playlists;
