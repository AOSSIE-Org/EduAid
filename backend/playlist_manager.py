import json
import os
from datetime import datetime
import uuid

class PlaylistManager:
    """Manages playlist storage and operations using JSON file"""
    
    def __init__(self, storage_file='playlists.json'):
        self.storage_file = storage_file
        self._ensure_storage_exists()
    
    def _ensure_storage_exists(self):
        """Create storage file if it doesn't exist"""
        if not os.path.exists(self.storage_file):
            self._save_data({'playlists': []})
    
    def _load_data(self):
        """Load playlists from JSON file"""
        try:
            with open(self.storage_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {'playlists': []}
    
    def _save_data(self, data):
        """Save playlists to JSON file"""
        with open(self.storage_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def create_playlist(self, name):
        """Create a new playlist"""
        data = self._load_data()
        
        playlist = {
            'id': str(uuid.uuid4()),
            'name': name,
            'created_at': datetime.now().isoformat(),
            'quizzes': []
        }
        
        data['playlists'].append(playlist)
        self._save_data(data)
        
        return playlist
    
    def get_all_playlists(self):
        """Get all playlists"""
        data = self._load_data()
        return data['playlists']
    
    def get_playlist(self, playlist_id):
        """Get a specific playlist by ID"""
        data = self._load_data()
        
        for playlist in data['playlists']:
            if playlist['id'] == playlist_id:
                return playlist
        
        return None
    
    def add_quiz_to_playlist(self, playlist_id, quiz_data):
        """Add a quiz to a playlist"""
        data = self._load_data()
        
        for playlist in data['playlists']:
            if playlist['id'] == playlist_id:
                # Generate quiz ID and determine order index
                quiz_id = str(uuid.uuid4())
                order_index = len(playlist['quizzes']) + 1
                
                quiz_entry = {
                    'quiz_id': quiz_id,
                    'order_index': order_index,
                    'quiz_data': quiz_data,
                    'added_at': datetime.now().isoformat()
                }
                
                playlist['quizzes'].append(quiz_entry)
                self._save_data(data)
                
                return quiz_entry
        
        return None
    
    def remove_quiz_from_playlist(self, playlist_id, quiz_id):
        """Remove a quiz from a playlist"""
        data = self._load_data()
        
        for playlist in data['playlists']:
            if playlist['id'] == playlist_id:
                # Find and remove the quiz
                playlist['quizzes'] = [
                    q for q in playlist['quizzes'] 
                    if q['quiz_id'] != quiz_id
                ]
                
                # Reorder remaining quizzes
                for idx, quiz in enumerate(playlist['quizzes'], start=1):
                    quiz['order_index'] = idx
                
                self._save_data(data)
                return True
        
        return False
    
    def delete_playlist(self, playlist_id):
        """Delete a playlist"""
        data = self._load_data()
        
        data['playlists'] = [
            p for p in data['playlists'] 
            if p['id'] != playlist_id
        ]
        
        self._save_data(data)
        return True
