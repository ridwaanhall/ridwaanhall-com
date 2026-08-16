"""Comment submission form."""

from django import forms

from apps.comments.models import MAX_COMMENT_LENGTH, Comment


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["body"]
        widgets = {
            "body": forms.Textarea(
                attrs={
                    "rows": 3,
                    "maxlength": MAX_COMMENT_LENGTH,
                    "placeholder": "Share your thoughts…",
                    "class": (
                        "w-full px-4 py-3 border border-zinc-700 rounded-lg "
                        "placeholder-zinc-500 focus:outline-none focus:border-zinc-500 "
                        "focus:ring-1 focus:ring-zinc-500 bg-transparent resize-y"
                    ),
                }
            )
        }
        error_messages = {
            "body": {
                "required": "Write something before posting.",
                "max_length": f"Comments are limited to {MAX_COMMENT_LENGTH} characters.",
            }
        }

    def clean_body(self):
        body = (self.cleaned_data.get("body") or "").strip()
        if not body:
            # A body of only whitespace passes the required check but is not a
            # comment; reject it rather than storing a blank row.
            raise forms.ValidationError("Write something before posting.")
        return body
