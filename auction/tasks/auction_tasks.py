from .celery_app import celery_app
import requests

@celery_app.task
def wait_for_countdown_task(player_id: int, bid_id: int):
    url = f"http://127.0.0.1:8000/auction/auto-sell/start-countdown/{player_id}"
    payload = {"current_bid_id": bid_id}
    try:
        response = requests.post(url, json=payload)
        return response.status_code
    except Exception as e:
        return str(e)

@celery_app.task
def wait_for_sale_task(player_id: int, bid_id: int):
    url = f"http://127.0.0.1:8000/auction/auto-sell/finalize/{player_id}"
    payload = {"current_bid_id": bid_id}
    try:
        response = requests.post(url, json=payload)
        return response.status_code
    except Exception as e:
        return str(e)
