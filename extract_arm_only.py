from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# Load original 3D robot image (1024x1024)
img = Image.open('frontend/src/assets/ai_robot_3d_clean.png').convert('RGBA')
width, height = img.size # 1024 x 1024

# Let's inspect where the earphone is:
# Head center is X ~ 512, Y ~ 300.
# Left earphone (viewer's left) is around X: 340..380, Y: 220..300.
# The raised arm joint is attached AT THE SHOULDER socket below the earphone, at X: 340..390, Y: 330..380.
# The raised forearm goes UP and LEFT: X: 190..330, Y: 40..280.

# 1. Create Arm Mask excluding earphone & head
arm_mask = Image.new('L', (width, height), 0)
draw = ImageDraw.Draw(arm_mask)

# Polygon precisely tracing ONLY the arm & hand:
# Start at shoulder socket (370, 350) -> outer arm elbow (310, 270) -> wrist/hand (190, 110) -> palm top (190, 40) -> fingers right (310, 40) -> inner elbow (340, 240) -> shoulder inner (340, 340)
arm_poly = [
    (180, 40),
    (315, 40),
    (325, 140),
    (345, 230),
    (385, 335),
    (345, 360),
    (300, 310),
    (240, 220),
    (180, 120)
]

draw.polygon(arm_poly, fill=255)

# Smooth mask edge slightly (1px blur)
arm_mask_smooth = arm_mask.filter(ImageFilter.GaussianBlur(1))

# Extract Arm Layer
img_np = np.array(img)
arm_mask_np = np.array(arm_mask_smooth) / 255.0

arm_np = np.zeros((height, width, 4), dtype=np.uint8)
for c in range(3):
    arm_np[:, :, c] = img_np[:, :, c]
arm_np[:, :, 3] = (img_np[:, :, 3] * arm_mask_np).astype(np.uint8)
arm_img = Image.fromarray(arm_np, 'RGBA')

# Save clean arm layer (strictly hand & arm only, zero head/ear)
arm_img.save('frontend/src/assets/ai_robot_arm_waving.png')

# 2. Create Body Base Layer
# Body layer keeps the FULL original robot body (head, earphones, visor, torso, thruster, left arm)
# and only erases the raised arm region above shoulder (340, 340) so when arm sways, no static duplicate arm shows behind!
body_np = img_np.copy()

# Erase only forearm & hand region from body:
erase_mask = Image.new('L', (width, height), 0)
draw_erase = ImageDraw.Draw(erase_mask)
erase_poly = [
    (180, 40),
    (315, 40),
    (325, 140),
    (335, 230),
    (350, 320),
    (310, 320),
    (240, 220),
    (180, 120)
]
draw_erase.polygon(erase_poly, fill=255)
erase_mask_np = np.array(erase_mask.filter(ImageFilter.GaussianBlur(1))) / 255.0

inv_erase_np = 1.0 - erase_mask_np
body_np[:, :, 3] = (body_np[:, :, 3] * inv_erase_np).astype(np.uint8)

body_img = Image.fromarray(body_np, 'RGBA')

# Draw clean smooth shoulder socket on body
draw_body = ImageDraw.Draw(body_img)
draw_body.ellipse([338, 310, 380, 350], fill=(235, 240, 250, 255), outline=(180, 190, 210, 255), width=2)
draw_body.ellipse([348, 318, 370, 340], fill=(40, 45, 55, 255))

body_img.save('frontend/src/assets/ai_robot_body_base.png')

print("Clean Arm & Body Layers Generated!")
