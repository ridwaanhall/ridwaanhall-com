"""
Validators for contact form
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class TurnstileValidator:
    """
    Handles Cloudflare Turnstile verification
    """
    
    VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    
    @staticmethod
    def verify(token):
        """
        Verify Cloudflare Turnstile token
        
        Args:
            token: The turnstile token to verify
            
        Returns:
            bool: True if verification successful, False otherwise
        """
        if not token:
            logger.warning('No Turnstile token provided')
            return False
        
        try:
            response = requests.post(
                TurnstileValidator.VERIFY_URL,
                data={
                    'secret': settings.CF_TURNSTILE_SECRET_KEY,
                    'response': token,
                },
                timeout=10
            )
            
            result = response.json()
            
            if result.get('success'):
                logger.info('Turnstile verification successful')
                return True
            else:
                logger.warning(f'Turnstile verification failed: {result.get("error-codes")}')
                return False
                
        except requests.RequestException as e:
            logger.error(f'Turnstile verification request failed: {str(e)}')
            return False
        except Exception as e:
            logger.error(f'Unexpected error during Turnstile verification: {str(e)}')
            return False