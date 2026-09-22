from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# Load original 3D robot image (1024x1024)
img = Image.open('frontend/src/assets/ai_robot_3d_clean.png').convert('RGBA')
width, height = img.size

# 1. Create Arm Mask
# The waving arm is on the left side (viewer's left), extending from shoulder (~350,300) up to hand (~240,40).
arm_mask = Image.new('L', (width, height), 0)
draw = ImageDraw.Draw(arm_mask)

# Polygon covering the raised arm & hand:
# (hand top-left -> hand top-right -> elbow outer -> shoulder socket -> elbow inner -> hand wrist)
arm_poly = [
    (180, 40),
    (340, 40),
    (430, 240),
    (385, 335),
    (335, 345),
    (290, 290),
    (200, 180),
    (180, 110)
]

draw.polygon(arm_poly, fill=255)

# Smooth mask edge slightly (1px blur)
arm_mask_smooth = arm_mask.filter(ImageFilter.GaussianBlur(1))

# Extract Arm Layer
arm_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
img_np = np.array(img)
arm_mask_np = np.array(arm_mask_smooth) / 255.0

for c in range(4):
    arm_img_c = (img_np[:, :, c] * arm_mask_np).astype(np.uint8)
    arm_img.putalpha(Image.fromarray((img_np[:, :, 3] * arm_mask_np).astype(np.uint8))) if c == 3 else None

# Put RGB channels in arm_img
arm_np = np.zeros((height, width, 4), dtype=np.uint8)
for c in range(3):
    arm_np[:, :, c] = img_np[:, :, c]
arm_np[:, :, 3] = (img_np[:, :, 3] * arm_mask_np).astype(np.uint8)
arm_img = Image.fromarray(arm_np, 'RGBA')

# Save isolated arm layer
arm_img.save('frontend/src/assets/ai_robot_arm_waving.png')

# 2. Create Body Layer (erasing arm from original body and restoring shoulder bulb)
body_np = img_np.copy()
inv_arm_mask_np = 1.0 - arm_mask_np

# Erase arm region from body
body_np[:, :, 3] = (body_np[:, :, 3] * inv_arm_mask_np).astype(np.uint8)

body_img = Image.fromarray(body_np, 'RGBA')

# Inpaint/Reconstruct shoulder ball joint behind arm so when arm sways, behind shoulder looks seamless:
# The shoulder joint is around X: 340..390, Y: 300..360.
# Let's draw a nice glossy white/metallic shoulder joint sphere on the body layer
draw_body = ImageDraw.Draw(body_img)
# Draw shoulder socket sphere
draw_body.ellipse([335, 305, 385, 355], fill=(230, 235, 245, 255), outline=(180, 190, 210, 255), width=2)
# Draw dark joint socket center
draw_body.ellipse([348, 318, 372, 342], fill=(40, 45, 55, 255))

body_img.save('frontend/src/assets/ai_robot_body_base.png')

print("Layers extracted successfully!")
