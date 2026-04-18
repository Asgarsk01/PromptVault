import os

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from prompts.models import Prompt, Tag

CURATED_TRENDING_TAGS = [
    'midjourney',
    'ui/ux',
    'editorial',
    '3d-render',
    'cyberpunk',
    'hyper-real',
    'minimalism',
]

CURATED_TAG_ALIASES = {
    'anime': 'midjourney',
    'architecture': 'editorial',
    'city': 'editorial',
    'cinematic': 'editorial',
    'cozy': 'minimalism',
    'design': 'ui/ux',
    'dragon': 'midjourney',
    'editorial': 'editorial',
    'environment': 'midjourney',
    'fantasy': 'midjourney',
    'fashion': 'editorial',
    'forest': 'midjourney',
    'gaming': 'cyberpunk',
    'hyper-real': 'hyper-real',
    'illustration': 'midjourney',
    'interior': 'minimalism',
    'landscape': 'editorial',
    'minimalism': 'minimalism',
    'midjourney': 'midjourney',
    'night': 'cyberpunk',
    'portrait': 'editorial',
    'product': 'hyper-real',
    'retro': 'midjourney',
    'scifi': 'midjourney',
    'surreal': 'midjourney',
    'travel': 'editorial',
    'ui/ux': 'ui/ux',
    '3d-render': '3d-render',
    'cyberpunk': 'cyberpunk',
}


PROMPTS_DATA = [
    {
        'title': 'Neon Bazaar Rainstorm',
        'content': 'Design a sprawling cyberpunk night market during monsoon rain, glowing magenta holograms, reflective pavement, steaming ramen stalls, drifting umbrellas, cinematic backlight, hyper-detailed crowd silhouettes, premium editorial color grading, volumetric fog, 35mm lens realism.',
        'complexity': 8,
        'tags': ['cyberpunk', 'scifi', 'editorial', 'night'],
    },
    {
        'title': 'Midjourney Fashion Temple',
        'content': 'Create a luxury fashion campaign inside a brutalist temple, marble dust in sunlight beams, model in sculptural black silk, avant-garde jewelry, symmetrical framing, minimal set dressing, crisp magazine photography, museum-grade color palette, premium art direction.',
        'complexity': 7,
        'tags': ['fashion', 'editorial', 'minimalism', 'portrait'],
    },
    {
        'title': 'Ancient Dragon Observatory',
        'content': 'Illustrate an ancient dragon coiled around a forgotten stone observatory on a mountain peak, aurora-filled sky, glowing runes, astronomer monks, epic scale, fantasy matte painting, textured clouds, mystical atmosphere, dramatic moonlight.',
        'complexity': 9,
        'tags': ['fantasy', 'dragon', 'landscape', 'cinematic'],
    },
    {
        'title': 'Bioluminescent Forest Shrine',
        'content': 'Imagine a hidden shrine deep in a forest of bioluminescent trees, fox spirits circling lanterns, wet moss on carved stairs, deep teal and amber contrast, immersive fantasy environment art, soft mist, elegant detail density, painterly realism.',
        'complexity': 8,
        'tags': ['fantasy', 'forest', 'environment', 'landscape'],
    },
    {
        'title': 'Hyper Real Watch Macro',
        'content': 'Photograph a luxury mechanical watch in extreme macro detail, sapphire crystal reflections, micro scratches, brushed steel crown, velvet shadow gradients, studio precision lighting, premium commercial product shot, tactile realism, ultra sharp focus stacking.',
        'complexity': 6,
        'tags': ['hyper-real', 'product', 'editorial', 'minimalism'],
    },
    {
        'title': 'Retro Space Motel',
        'content': 'Create a retro-futurist roadside motel on Mars, warm neon vacancy sign, dusty red horizon, parked rover convertible, Wes Anderson inspired symmetry, pastel sci-fi palette, whimsical signage, clean composition, cinematic storytelling.',
        'complexity': 7,
        'tags': ['scifi', 'retro', 'travel', 'cinematic'],
    },
    {
        'title': 'Studio Ghibli Tea House',
        'content': 'Illustrate a peaceful hilltop tea house in a Studio Ghibli inspired world, wind through paper charms, mossy roof tiles, distant mountains, handwritten signage, cozy afternoon glow, soft watercolor textures, gentle characterful detail.',
        'complexity': 5,
        'tags': ['anime', 'cozy', 'landscape', 'illustration'],
    },
    {
        'title': 'Brutalist UI Concept Board',
        'content': 'Generate a premium brutalist UI showcase for an AI design tool, oversized typography, structured grid, monochrome surfaces, bright red accent system, layered panels, crisp product mockups, art-directed presentation, poster-like visual tension.',
        'complexity': 6,
        'tags': ['ui/ux', 'editorial', 'minimalism', 'design'],
    },
    {
        'title': 'Floating Monastery Above Clouds',
        'content': 'Visualize a gigantic floating monastery above dense sunrise clouds, carved stone bridges connecting towers, monks in crimson robes, golden prayer flags, cinematic god rays, atmospheric fantasy illustration, awe-inspiring vertical scale.',
        'complexity': 9,
        'tags': ['fantasy', 'architecture', 'landscape', 'cinematic'],
    },
    {
        'title': 'Editorial Portrait in Red Gel',
        'content': 'Shoot a close editorial portrait under red gel lighting, intense eye contact, glossy skin texture, subtle freckles, black backdrop, shallow depth of field, luxury beauty campaign framing, refined contrast, dramatic mood.',
        'complexity': 5,
        'tags': ['portrait', 'editorial', 'fashion', 'hyper-real'],
    },
    {
        'title': '3D Render Dessert Lab',
        'content': 'Build a stylized 3D render of a futuristic dessert laboratory, chrome counters, translucent jelly spheres, pastel machinery, glossy ceramic materials, softbox lighting, playful product design, clean reflections, polished Octane quality.',
        'complexity': 7,
        'tags': ['3d-render', 'product', 'scifi', 'minimalism'],
    },
    {
        'title': 'Desert Nomad Caravan at Blue Hour',
        'content': 'Paint a cinematic caravan of desert nomads crossing giant dunes at blue hour, lantern-lit camels, textured wind trails, wide angle composition, sparse but majestic atmosphere, sweeping clouds, earthy palette with cobalt sky.',
        'complexity': 7,
        'tags': ['travel', 'landscape', 'cinematic', 'editorial'],
    },
    {
        'title': 'Underwater Library Ruins',
        'content': 'Depict a grand ruined library submerged underwater, drifting pages, coral-covered shelves, shafts of sunlight from the surface, ghostly blue ambience, surreal fantasy worldbuilding, exquisite environmental storytelling, rich texture detail.',
        'complexity': 9,
        'tags': ['fantasy', 'environment', 'surreal', 'landscape'],
    },
    {
        'title': 'Minimal Ceramic Vase Study',
        'content': 'Create a serene minimal still life with a handmade ceramic vase, limestone pedestal, soft morning shadow, muted ivory palette, subtle tactile imperfections, high-end interior magazine mood, precise composition, negative space mastery.',
        'complexity': 4,
        'tags': ['minimalism', 'editorial', 'product', 'interior'],
    },
    {
        'title': 'Cyber Samurai Alley Portrait',
        'content': 'Photograph a cyber samurai standing in a narrow alley of flickering signs, rain droplets on armor, restrained color palette of crimson and cyan, cinematic smoke, sharp portrait framing, premium gaming key art energy.',
        'complexity': 8,
        'tags': ['cyberpunk', 'portrait', 'cinematic', 'gaming'],
    },
    {
        'title': 'Glasshouse Jungle Cafe',
        'content': 'Visualize a lush glasshouse cafe hidden in dense tropical foliage, morning condensation on windows, warm wood furniture, hanging lights, boutique hospitality branding, travel editorial tone, photoreal interior composition.',
        'complexity': 6,
        'tags': ['interior', 'travel', 'editorial', 'landscape'],
    },
    {
        'title': 'Astronaut Botanical Portrait',
        'content': 'Design a surreal portrait of an astronaut helmet filled with blooming wildflowers and moss, soft neutral background, studio lighting, poetic editorial styling, realistic reflections on visor, dreamy art print quality.',
        'complexity': 7,
        'tags': ['surreal', 'portrait', 'scifi', 'editorial'],
    },
    {
        'title': 'Nordic Cabin Snowfall',
        'content': 'Capture a remote Nordic cabin during heavy snowfall, amber window glow against icy blue dusk, pine trees fading in mist, cozy cinematic travel poster mood, natural texture detail, serene winter storytelling.',
        'complexity': 5,
        'tags': ['travel', 'landscape', 'cozy', 'cinematic'],
    },
    {
        'title': 'Luxury Sneaker Pedestal Shot',
        'content': 'Produce a premium sneaker launch image on a sculpted stone pedestal, directional lighting, floating dust, controlled shadow falloff, macro knit texture, streetwear campaign styling, commercial polish, high-end product photography.',
        'complexity': 6,
        'tags': ['product', 'fashion', 'editorial', 'hyper-real'],
    },
    {
        'title': 'Cathedral of Light UI Splash',
        'content': 'Create a landing page hero concept inspired by a cathedral of light, dramatic typography, layered translucent panes, silver-white surfaces, restrained red accents, luxury SaaS aesthetic, immersive product storytelling, sharp UI composition.',
        'complexity': 6,
        'tags': ['ui/ux', 'design', 'minimalism', 'editorial'],
    },
    {
        'title': 'Volcanic Phoenix Rebirth',
        'content': 'Illustrate a phoenix rising from volcanic cliffs at dawn, lava rivers below, enormous wings igniting ash clouds, mythic fantasy spectacle, intense warm palette, ultra-detailed feathers, dynamic action composition.',
        'complexity': 10,
        'tags': ['fantasy', 'dragon', 'cinematic', 'landscape'],
    },
    {
        'title': 'Quiet Library Anime Scene',
        'content': 'Draw a quiet anime library scene with warm afternoon sun, dust motes in the air, wooden ladders, a student asleep over sketchbooks, soft pastel shading, intimate slice-of-life mood, charming detail work.',
        'complexity': 4,
        'tags': ['anime', 'cozy', 'illustration', 'interior'],
    },
    {
        'title': 'Hyper Real Cocktail Motion Freeze',
        'content': 'Shoot a crystal cocktail splash frozen in motion, suspended citrus peel, studio black background, premium beverage campaign styling, razor sharp droplets, dramatic rim lighting, luxury bar editorial energy.',
        'complexity': 7,
        'tags': ['hyper-real', 'product', 'editorial', 'minimalism'],
    },
    {
        'title': 'Moonlit Cliffside Temple',
        'content': 'Imagine an ancient temple carved into a cliff over the ocean under full moonlight, crashing waves below, silver-blue palette, sacred lanterns, monumental architecture, serene cinematic framing, fantasy adventure tone.',
        'complexity': 8,
        'tags': ['fantasy', 'architecture', 'landscape', 'night'],
    },
    {
        'title': 'Editorial Streetwear Roofline',
        'content': 'Create a streetwear editorial on a rooftop at sunset, oversized silhouette garments, moody skyline haze, confident model stance, luxury magazine composition, warm highlights, crisp contrast, effortless attitude.',
        'complexity': 6,
        'tags': ['fashion', 'editorial', 'portrait', 'city'],
    },
]


def ensure_tags(tag_names):
    tags = {}
    for tag_name in sorted(set(tag_names)):
        normalized = tag_name.strip().lower()
        tag, _ = Tag.objects.get_or_create(name=normalized)
        tags[normalized] = tag
    return tags


def curate_tags(raw_tags):
    curated = []

    for tag_name in raw_tags:
        normalized = tag_name.strip().lower()
        curated_tag = CURATED_TAG_ALIASES.get(normalized)

        if not curated_tag:
            continue

        if curated_tag in curated:
            continue

        curated.append(curated_tag)

        if len(curated) == 4:
            break

    if curated:
        return curated

    return ['midjourney']


def seed_prompts():
    all_tag_names = CURATED_TRENDING_TAGS
    tags = ensure_tags(all_tag_names)

    created_count = 0
    updated_count = 0

    for prompt_data in PROMPTS_DATA:
        prompt, created = Prompt.objects.update_or_create(
            title=prompt_data['title'],
            defaults={
                'content': prompt_data['content'],
                'complexity': prompt_data['complexity'],
            },
        )

        prompt.tags.set([tags[tag_name] for tag_name in curate_tags(prompt_data['tags'])])

        if created:
            created_count += 1
            print(f'Created prompt: {prompt.title}')
        else:
            updated_count += 1
            print(f'Updated prompt: {prompt.title}')

    normalized_count = 0
    for prompt in Prompt.objects.prefetch_related('tags').all():
        normalized_tags = [tags[tag_name] for tag_name in curate_tags([tag.name for tag in prompt.tags.all()])]
        current_tag_ids = list(prompt.tags.values_list('id', flat=True))
        normalized_tag_ids = [tag.id for tag in normalized_tags]

        if current_tag_ids != normalized_tag_ids:
            prompt.tags.set(normalized_tags)
            normalized_count += 1

    print('')
    print(f'Seed complete. Created {created_count} prompts and updated {updated_count} prompts.')
    print(f'Normalized tags on {normalized_count} existing prompts.')
    print(f'Total prompts in database: {Prompt.objects.count()}')
    print(f'Total tags in database: {Tag.objects.count()}')


if __name__ == '__main__':
    seed_prompts()
