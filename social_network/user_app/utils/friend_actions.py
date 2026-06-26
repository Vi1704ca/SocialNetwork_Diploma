from user_app.models import Friendship


def get_profile_url(user):
    return f"/profile/{user.id}/"


def add_friend_request(current_user, other_user):
    if current_user.id == other_user.id:
        return {
            "success": False,
            "message": "Не можна додати самого себе",
        }

    incoming_request = Friendship.objects.filter(
        from_user=other_user,
        to_user=current_user,
        status="pending"
    ).first()

    if incoming_request:
        incoming_request.status = "accepted"
        incoming_request.save()

        return {
            "success": True,
            "redirect": get_profile_url(other_user),
        }

    Friendship.objects.get_or_create(
        from_user=current_user,
        to_user=other_user,
        defaults={"status": "pending"}
    )

    return {
        "success": True,
        "redirect": get_profile_url(other_user),
    }


def dismiss_recommendation(current_user, other_user):
    friendship = (
        Friendship.objects.filter(from_user=current_user, to_user=other_user).first()
        or Friendship.objects.filter(from_user=other_user, to_user=current_user).first()
    )

    if friendship:
        friendship.from_user = current_user
        friendship.to_user = other_user
        friendship.status = "dismissed"
        friendship.save()
    else:
        Friendship.objects.create(
            from_user=current_user,
            to_user=other_user,
            status="dismissed"
        )

    return {
        "success": True,
        "remove": True,
    }

def accept_friend_request(current_user, other_user):
    friendship = Friendship.objects.filter(
        from_user=other_user,
        to_user=current_user,
        status="pending"
    ).first()

    if not friendship:
        return {
            "success": False,
            "message": "Запит не знайдено або вже опрацьований",
        }

    friendship.status = "accepted"
    friendship.save()

    return {
        "success": True,
        "redirect": get_profile_url(other_user),
    }


def delete_friendship(current_user, other_user):
    friendship = (
        Friendship.objects.filter(from_user=current_user, to_user=other_user).first()
        or Friendship.objects.filter(from_user=other_user, to_user=current_user).first()
    )

    if not friendship:
        return {
            "success": True,
            "remove": True,
        }

    if friendship.status == "pending" and friendship.from_user_id == other_user.id:
        friendship.status = "dismissed"
        friendship.save()
    else:
        friendship.delete()

    return {
        "success": True,
        "remove": True,
    }