"""
Payment Webhook Handlers
Handles Paddle and Coinbase Commerce webhooks for subscription management
"""
import os
import hmac
import hashlib
import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from supabase import create_client, Client

payment_bp = Blueprint('payment', __name__)

# Initialize Supabase with service role key for write access
def get_supabase_admin() -> Client:
    """Get Supabase client with service role key"""
    url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        raise ValueError("Missing Supabase credentials")
    return create_client(url, service_key)


# ============================================
# PADDLE WEBHOOK HANDLERS
# ============================================

def verify_paddle_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Paddle webhook signature using HMAC-SHA256
    Paddle Billing uses webhook secret for signature verification
    """
    webhook_secret = os.environ.get("PADDLE_WEBHOOK_SECRET")
    if not webhook_secret:
        print("⚠️ PADDLE_WEBHOOK_SECRET not configured")
        return False
    
    try:
        # Paddle signature format: ts=timestamp;h1=hash
        parts = dict(part.split('=') for part in signature.split(';'))
        timestamp = parts.get('ts', '')
        expected_hash = parts.get('h1', '')
        
        # Recreate the signed payload
        signed_payload = f"{timestamp}:{payload.decode('utf-8')}"
        computed_hash = hmac.new(
            webhook_secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception as e:
        print(f"❌ Paddle signature verification error: {e}")
        return False


@payment_bp.route('/api/webhooks/paddle', methods=['POST', 'OPTIONS'])
def paddle_webhook():
    """Handle Paddle Billing subscription events"""
    if request.method == 'OPTIONS':
        return '', 204
    
    # Verify signature
    signature = request.headers.get('Paddle-Signature', '')
    
    # In development, allow bypassing signature check
    if os.environ.get("FLASK_ENV") != "development":
        if not verify_paddle_signature(request.data, signature):
            print("❌ Invalid Paddle webhook signature")
            return jsonify({"error": "Invalid signature"}), 401
    
    try:
        event = request.json
        event_type = event.get('event_type')
        event_id = event.get('event_id')
        data = event.get('data', {})
        
        print(f"📥 Paddle webhook received: {event_type} (ID: {event_id})")
        
        supabase = get_supabase_admin()
        
        # Idempotency check - skip if already processed
        existing = supabase.table('webhook_events').select('id').eq('event_id', event_id).execute()
        if existing.data:
            print(f"⏭️ Event {event_id} already processed, skipping")
            return jsonify({"status": "already_processed"}), 200
        
        # Log event for idempotency
        supabase.table('webhook_events').insert({
            'event_id': event_id,
            'provider': 'paddle',
            'event_type': event_type,
            'payload': event
        }).execute()
        
        # Extract user ID from custom data
        custom_data = data.get('custom_data', {})
        user_id = custom_data.get('userId')
        
        if not user_id:
            print("⚠️ No userId in custom_data, checking customer email")
            # Try to find user by email
            customer_email = data.get('customer', {}).get('email')
            if customer_email:
                user_result = supabase.table('profiles').select('id').eq('email', customer_email).execute()
                if user_result.data:
                    user_id = user_result.data[0]['id']
        
        if not user_id:
            print("❌ Could not identify user for subscription event")
            return jsonify({"error": "User not found"}), 400
        
        # Handle different event types
        if event_type == 'subscription.created':
            handle_paddle_subscription_created(supabase, user_id, data)
        elif event_type == 'subscription.activated':
            handle_paddle_subscription_activated(supabase, user_id, data)
        elif event_type == 'subscription.updated':
            handle_paddle_subscription_updated(supabase, user_id, data)
        elif event_type == 'subscription.canceled':
            handle_paddle_subscription_canceled(supabase, user_id, data)
        elif event_type == 'subscription.past_due':
            handle_paddle_subscription_past_due(supabase, user_id, data)
        elif event_type == 'subscription.paused':
            handle_paddle_subscription_paused(supabase, user_id, data)
        
        return jsonify({"status": "ok"}), 200
        
    except Exception as e:
        print(f"❌ Paddle webhook error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def handle_paddle_subscription_created(supabase: Client, user_id: str, data: dict):
    """Handle new subscription creation"""
    subscription_id = data.get('id')
    customer_id = data.get('customer_id')
    status = data.get('status', 'active')
    
    # Determine plan type from items
    items = data.get('items', [])
    plan_type = 'monthly'  # default
    for item in items:
        price = item.get('price', {})
        billing_cycle = price.get('billing_cycle', {})
        if billing_cycle.get('interval') == 'year':
            plan_type = 'yearly'
            break
    
    # Calculate period dates
    current_period = data.get('current_billing_period', {})
    period_start = current_period.get('starts_at')
    period_end = current_period.get('ends_at')
    
    print(f"✅ Creating subscription for user {user_id}: {plan_type}")
    
    supabase.table('subscriptions').upsert({
        'user_id': user_id,
        'paddle_customer_id': customer_id,
        'paddle_subscription_id': subscription_id,
        'status': 'active' if status == 'active' else status,
        'plan_type': plan_type,
        'payment_provider': 'paddle',
        'current_period_start': period_start,
        'current_period_end': period_end,
        'updated_at': datetime.utcnow().isoformat()
    }, on_conflict='user_id').execute()
    
    # Update profile tier
    supabase.table('profiles').update({
        'tier': 'premium',
        'subscription_id': subscription_id,
        'customer_id': customer_id,
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', user_id).execute()


def handle_paddle_subscription_activated(supabase: Client, user_id: str, data: dict):
    """Handle subscription activation (after trial or payment)"""
    handle_paddle_subscription_created(supabase, user_id, data)


def handle_paddle_subscription_updated(supabase: Client, user_id: str, data: dict):
    """Handle subscription update (plan change, etc.)"""
    status = data.get('status', 'active')
    
    # Determine new plan type
    items = data.get('items', [])
    plan_type = 'monthly'
    for item in items:
        price = item.get('price', {})
        billing_cycle = price.get('billing_cycle', {})
        if billing_cycle.get('interval') == 'year':
            plan_type = 'yearly'
            break
    
    current_period = data.get('current_billing_period', {})
    
    print(f"🔄 Updating subscription for user {user_id}: {plan_type}, status={status}")
    
    supabase.table('subscriptions').update({
        'status': status,
        'plan_type': plan_type,
        'current_period_start': current_period.get('starts_at'),
        'current_period_end': current_period.get('ends_at'),
        'updated_at': datetime.utcnow().isoformat()
    }).eq('user_id', user_id).execute()


def handle_paddle_subscription_canceled(supabase: Client, user_id: str, data: dict):
    """Handle subscription cancellation"""
    print(f"❌ Subscription canceled for user {user_id}")
    
    supabase.table('subscriptions').update({
        'status': 'canceled',
        'updated_at': datetime.utcnow().isoformat()
    }).eq('user_id', user_id).execute()
    
    # Downgrade profile tier
    supabase.table('profiles').update({
        'tier': 'basic',
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', user_id).execute()


def handle_paddle_subscription_past_due(supabase: Client, user_id: str, data: dict):
    """Handle subscription payment failure"""
    print(f"⚠️ Subscription past due for user {user_id}")
    
    supabase.table('subscriptions').update({
        'status': 'past_due',
        'updated_at': datetime.utcnow().isoformat()
    }).eq('user_id', user_id).execute()


def handle_paddle_subscription_paused(supabase: Client, user_id: str, data: dict):
    """Handle subscription pause"""
    print(f"⏸️ Subscription paused for user {user_id}")
    
    supabase.table('subscriptions').update({
        'status': 'paused',
        'updated_at': datetime.utcnow().isoformat()
    }).eq('user_id', user_id).execute()


# ============================================
# COINBASE COMMERCE WEBHOOK HANDLERS
# ============================================

def verify_coinbase_signature(payload: bytes, signature: str) -> bool:
    """Verify Coinbase Commerce webhook signature"""
    webhook_secret = os.environ.get("COINBASE_WEBHOOK_SECRET")
    if not webhook_secret:
        print("⚠️ COINBASE_WEBHOOK_SECRET not configured")
        return False
    
    try:
        expected_sig = hmac.new(
            webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, signature)
    except Exception as e:
        print(f"❌ Coinbase signature verification error: {e}")
        return False


@payment_bp.route('/api/webhooks/coinbase', methods=['POST', 'OPTIONS'])
def coinbase_webhook():
    """Handle Coinbase Commerce payment events"""
    if request.method == 'OPTIONS':
        return '', 204
    
    # Verify signature
    signature = request.headers.get('X-CC-Webhook-Signature', '')
    
    if os.environ.get("FLASK_ENV") != "development":
        if not verify_coinbase_signature(request.data, signature):
            print("❌ Invalid Coinbase webhook signature")
            return jsonify({"error": "Invalid signature"}), 401
    
    try:
        event = request.json
        event_type = event.get('event', {}).get('type')
        event_id = event.get('event', {}).get('id')
        charge = event.get('event', {}).get('data', {})
        
        print(f"📥 Coinbase webhook received: {event_type} (ID: {event_id})")
        
        supabase = get_supabase_admin()
        
        # Idempotency check
        existing = supabase.table('webhook_events').select('id').eq('event_id', event_id).execute()
        if existing.data:
            print(f"⏭️ Event {event_id} already processed, skipping")
            return jsonify({"status": "already_processed"}), 200
        
        # Log event
        supabase.table('webhook_events').insert({
            'event_id': event_id,
            'provider': 'coinbase',
            'event_type': event_type,
            'payload': event
        }).execute()
        
        # Handle events
        if event_type == 'charge:confirmed':
            handle_coinbase_charge_confirmed(supabase, charge)
        elif event_type == 'charge:failed':
            handle_coinbase_charge_failed(supabase, charge)
        elif event_type == 'charge:pending':
            print(f"⏳ Charge pending: {charge.get('code')}")
        
        return jsonify({"status": "ok"}), 200
        
    except Exception as e:
        print(f"❌ Coinbase webhook error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def handle_coinbase_charge_confirmed(supabase: Client, charge: dict):
    """Handle confirmed crypto payment - activate subscription"""
    metadata = charge.get('metadata', {})
    user_id = metadata.get('userId')
    plan_type = metadata.get('planId', 'monthly')
    charge_id = charge.get('id')
    charge_code = charge.get('code')
    
    if not user_id:
        print("❌ No userId in charge metadata")
        return
    
    # Calculate subscription period
    now = datetime.utcnow()
    if plan_type == 'yearly':
        period_end = now + timedelta(days=365)
    else:
        period_end = now + timedelta(days=30)
    
    print(f"✅ Crypto payment confirmed for user {user_id}: {plan_type}")
    
    supabase.table('subscriptions').upsert({
        'user_id': user_id,
        'coinbase_charge_id': charge_id,
        'coinbase_charge_code': charge_code,
        'status': 'active',
        'plan_type': plan_type,
        'payment_provider': 'coinbase',
        'current_period_start': now.isoformat(),
        'current_period_end': period_end.isoformat(),
        'updated_at': now.isoformat()
    }, on_conflict='user_id').execute()
    
    # Update profile tier
    supabase.table('profiles').update({
        'tier': 'premium',
        'updated_at': now.isoformat()
    }).eq('id', user_id).execute()


def handle_coinbase_charge_failed(supabase: Client, charge: dict):
    """Handle failed crypto payment"""
    metadata = charge.get('metadata', {})
    user_id = metadata.get('userId')
    
    if user_id:
        print(f"❌ Crypto payment failed for user {user_id}")
        # Could send notification to user here


# ============================================
# CRYPTO CHARGE CREATION ENDPOINT
# ============================================

@payment_bp.route('/api/create-crypto-charge', methods=['POST', 'OPTIONS'])
def create_crypto_charge():
    """Create a Coinbase Commerce charge for crypto payment"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        coinbase_api_key = os.environ.get("COINBASE_API_KEY")
        
        if not coinbase_api_key:
            return jsonify({"error": "Coinbase not configured"}), 500
        
        import requests
        
        response = requests.post(
            'https://api.commerce.coinbase.com/charges',
            headers={
                'Content-Type': 'application/json',
                'X-CC-Api-Key': coinbase_api_key,
                'X-CC-Version': '2018-03-22'
            },
            json={
                'name': data.get('name', 'Level Premium'),
                'description': data.get('description', 'Premium subscription'),
                'pricing_type': 'fixed_price',
                'local_price': data.get('local_price', {'amount': '7.99', 'currency': 'USD'}),
                'metadata': data.get('metadata', {}),
                'redirect_url': data.get('redirect_url'),
                'cancel_url': data.get('cancel_url')
            }
        )
        
        if response.status_code == 201:
            charge_data = response.json().get('data', {})
            return jsonify({
                'id': charge_data.get('id'),
                'code': charge_data.get('code'),
                'hosted_url': charge_data.get('hosted_url'),
                'expires_at': charge_data.get('expires_at')
            })
        else:
            print(f"❌ Coinbase API error: {response.text}")
            return jsonify({"error": "Failed to create charge"}), 500
            
    except Exception as e:
        print(f"❌ Create charge error: {e}")
        return jsonify({"error": str(e)}), 500
