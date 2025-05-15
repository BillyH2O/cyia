import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from .config import Config

class SessionLogger:
    def __init__(self):
        self.session_log = {
            "session_id": datetime.now().strftime('%Y%m%d_%H%M%S'),
            "interactions": []
        }
        logging.info(f"Session logger initialized with ID: {self.session_log['session_id']}")
    
    def log_interaction(
        self, 
        question: str, 
        answer: str, 
        sources: List[Dict[str, Any]], 
        evaluation: Optional[str], 
        processing_time: float, 
        timing_breakdown: Dict[str, float], 
        error: Optional[str] = None, 
        flags: Optional[Dict[str, bool]] = None
    ) -> None:
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "question": question,
            "answer": answer,
            "sources": sources,
            "source_evaluation": evaluation,
            "processing_time": processing_time,
            "timing_breakdown": timing_breakdown,
            "flags_used": flags if flags is not None else {}
        }
        
        if error:
            interaction["error"] = str(error)
        
        self.session_log["interactions"].append(interaction)
        self._save_to_file()
    
    def _save_to_file(self) -> None:
        try:
            with open(Config.LOG_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.session_log, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logging.error(f"Failed to write log file {Config.LOG_FILE}: {e}")
    
    def get_session_id(self) -> str:
        return self.session_log["session_id"]
    
    def get_interaction_count(self) -> int:
        return len(self.session_log["interactions"])
    
    def get_session_log(self) -> Dict[str, Any]:
        return self.session_log 