from django import forms

# Shared Tailwind classes for the contact form's input widgets.
_FIELD_CLASS = (
    'w-full rounded-md border border-zinc-700 hover:border-zinc-400 px-3 py-2 '
    'focus:outline-none focus:border-zinc-400 bg-transparent placeholder-zinc-400 '
    'text-zinc-300 hover:text-zinc-200 transition-all duration-300'
)
_TEXTAREA_CLASS = _FIELD_CLASS.replace('transition-all', 'resize-vertical transition-all')


class ContactForm(forms.Form):
    """Contact form for visitors to send messages"""

    name = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={
            'class': _FIELD_CLASS,
            'placeholder': 'Name*'
        }),
        label='Name'
    )

    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': _FIELD_CLASS,
            'placeholder': 'Email*'
        }),
        label='Email'
    )

    message = forms.CharField(
        max_length=5000,
        required=True,
        widget=forms.Textarea(attrs={
            'class': _TEXTAREA_CLASS,
            'rows': '5',
            'placeholder': 'Message*'
        }),
        label='Message'
    )