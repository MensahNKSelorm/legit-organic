"""Server-side sanitisation for rich text exposed through the public API."""

import nh3


def clean_rich_html(value):
    if not isinstance(value, str) or not value:
        return value
    return nh3.clean(value)


class SafeHTMLRepresentationMixin:
    """Sanitise named fields at the final API representation boundary."""

    html_fields = ()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in self.html_fields:
            if field in data:
                data[field] = clean_rich_html(data[field])
        return data
