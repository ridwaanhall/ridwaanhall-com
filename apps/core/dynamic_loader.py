"""
Shared loader for the Individual File System content architecture:
dynamically imports one dataclass-shaped dict per file from a directory.
"""

import importlib.util
from pathlib import Path
from typing import Any, Callable


def load_items_from_dir(
    dir_path: Path,
    glob_pattern: str,
    data_attr: str,
    transform: Callable[[dict[str, Any]], dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """
    Dynamically import every file in dir_path matching glob_pattern and collect
    the dict found at module attribute data_attr, in sorted filename order.
    """
    items: list[dict[str, Any]] = []

    if not dir_path.exists():
        return items

    for file_path in sorted(dir_path.glob(glob_pattern)):
        try:
            spec = importlib.util.spec_from_file_location(f"_ifs_{file_path.stem}", file_path)
            if spec is None or spec.loader is None:
                continue
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if not hasattr(module, data_attr):
                continue

            data = getattr(module, data_attr).copy()
            if transform:
                data = transform(data)
            items.append(data)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            continue

    return items


def add_image_compat_fields(data: dict[str, Any]) -> dict[str, Any]:
    """Inject backward-compatible single-image fields alongside a multi-image dict."""
    if 'images' in data and data['images']:
        first_image_url = list(data['images'].values())[0]
        first_image_name = list(data['images'].keys())[0]

        data['image_url'] = first_image_url
        data['img_name'] = first_image_name
        data['image_list'] = list(data['images'].values())
        data['image_names'] = list(data['images'].keys())
        data['image_count'] = len(data['images'])
        data['get_image'] = lambda name: data['images'].get(name, '')

    return data
