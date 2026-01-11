from django import forms
from django.core.validators import EmailValidator


class ContactForm(forms.Form):
    """Contact form for visitors to send messages"""
    
    name = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'w-full rounded-md border border-zinc-700 hover:border-zinc-400 px-3 py-2 focus:outline-none focus:border-zinc-400 bg-transparent placeholder-zinc-400 text-zinc-300 hover:text-zinc-200 transition-all duration-300',
            'placeholder': 'Name*'
        }),
        label='Name'
    )
    
    email = forms.EmailField(
        required=True,
        validators=[EmailValidator()],
        widget=forms.EmailInput(attrs={
            'class': 'w-full rounded-md border border-zinc-700 hover:border-zinc-400 px-3 py-2 focus:outline-none focus:border-zinc-400 bg-transparent placeholder-zinc-400 text-zinc-300 hover:text-zinc-200 transition-all duration-300',
            'placeholder': 'Email*'
        }),
        label='Email'
    )
    
    message = forms.CharField(
        required=True,
        widget=forms.Textarea(attrs={
            'class': 'w-full rounded-md border border-zinc-700 hover:border-zinc-400 px-3 py-2 focus:outline-none focus:border-zinc-400 bg-transparent placeholder-zinc-400 text-zinc-300 hover:text-zinc-200 resize-vertical transition-all duration-300',
            'rows': '5',
            'placeholder': 'Message*'
        }),
        label='Message'
    )