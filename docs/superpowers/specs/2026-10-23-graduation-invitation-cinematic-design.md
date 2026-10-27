# Thiết kế: Flight to the Future — giao diện lời mời điện ảnh

**Trạng thái:** Đã được người dùng duyệt ngày 23-10-2026.

**Bổ sung diễn tiến chuyến bay:** Máy bay vút lên, nhả tấm vé; vé lả lướt rơi xuống rồi ổn định để mở. Hiệu ứng máy bay và khói thuộc sân khấu Three.js; boarding pass có biểu tượng máy bay và đường bay riêng.

**Tinh chỉnh sau góp ý về người nhận:** Bảng nói thẳng “BẠN ĐÃ BỊ HACK!” để người không làm IT hiểu trò đùa; câu kế tiếp trấn an rằng điện thoại vẫn an toàn và hé lộ lời mời tốt nghiệp. Nhãn, trạng thái và dòng dữ liệu đều dùng tiếng Việt đời thường thay cho thuật ngữ điều hướng. Giữ lớp kim loại/kính, camera phối cảnh dolly/pan liên tục, parallax và ánh đỏ đập nhịp để cảnh vẫn có chất điện ảnh.

## Ý định và tiêu chí thành công

Làm mới trải nghiệm lời mời tốt nghiệp hiện có để đoạn cảnh báo giả tạo cảm giác như một vật thể 3D có khối lượng, ánh sáng và nhịp đập, thay vì một thẻ UI phẳng. Người nhận vẫn đi qua mạch chuyện ngắn: mở tín hiệu → cảnh báo chiếm màn hình → mascot kéo bảng ra → vé mời và chi tiết sự kiện.

Thành công khi:

- Cảnh hack phủ màn hình, có camera phối cảnh chuyển động liên tục, parallax theo chiều sâu, và nhịp đỏ kép rõ nhưng không nhấp nháy gắt.
- Cảnh báo trông như một bảng kim loại/kính khói phát sáng trong một không gian điện ảnh hư cấu.
- Chữ và thao tác vẫn sắc nét, đọc được trên điện thoại và có thể dùng bằng bàn phím.
- Mascot thật sự chạm và kéo bảng cảnh báo; vé mời trở thành điểm tập trung sau cú chuyển cảnh.
- Sau vùng sáng ấm, máy bay 3D vút chéo lên và nhả vé; khói mỏng kéo phía sau, vé xoay nhẹ rồi lả lướt xuống vị trí cuối. Trên boarding pass có máy bay cùng nét đường bay.
- Các nút bắt đầu, bỏ qua, xem vé, RSVP và xem lại tiếp tục hoạt động như demo.

## Sự thật sản phẩm và giới hạn

- Người dùng đã chọn Vite + JavaScript thuần + Three.js và hướng dựng trực tiếp bằng code.
- Demo hiện có guest query parameter, nút start/skip/replay, vé mời, chi tiết và RSVP chỉ hiển thị phản hồi trên màn hình.
- Ngày, giờ, địa điểm và tên người tốt nghiệp chưa được cung cấp; giữ nội dung “Sẽ cập nhật”.
- Màn hình takeover phải tiếp tục được thể hiện rõ là hư cấu. Không đọc dữ liệu, yêu cầu quyền truy cập, hay giả giao diện cảnh báo thật của hệ điều hành/trình duyệt.
- Không thêm dịch vụ RSVP, âm thanh, QR hay thông tin sự kiện mới.

## Hướng thị giác

Lấy chất liệu từ một bảng cảnh báo trên buồng lái: tấm kim loại tối có cạnh vát, kính khói, đèn báo đỏ nằm sâu sau lớp kính và các lớp tín hiệu chạy lùi vào nền. Ánh xanh dữ liệu chỉ làm nền cho cảnh báo; vé mời chuyển sang navy, ivory và champagne để tạo cảm giác ấm sau cảnh căng thẳng. Giữ mascot tốt nghiệp hiện có làm cú phá nhịp vui vẻ.

### Nhịp và hành động

Sau thao tác mở, các dòng chữ ngắn bằng tiếng Việt xuất hiện ở nhiều lớp sâu và tốc độ khác nhau. Một camera phối cảnh tiến nhẹ, trôi ngang rất nhỏ và parallax các tín hiệu phía sau. Bảng cảnh báo vào giữa màn hình với một cú dừng có quán tính; mặt kính/kim loại nghiêng nhẹ theo camera. Đèn trong bảng đập theo nhịp kép khoảng một lần mỗi giây: nhịp đầu lớn hơn, nhịp thứ hai ngắn và nhỏ hơn; viền sáng và camera chỉ phản hồi nhẹ. Tránh strobe, camera shake mạnh và âm thanh tự phát.

Khi mascot tiến vào, tay mascot bắt cạnh bảng; bảng nghiêng theo điểm nắm, trễ một nhịp rồi bị kéo khỏi màn hình. Bảng mất đi sẽ để lộ vùng sáng ấm phía sau. Một máy bay phản sáng vút từ thấp bên trái lên cao bên phải, kéo theo các cụm khói mềm. Khi lướt qua vùng trung tâm, máy bay nhả một boarding pass; vé xoay nhẹ, lượn xuống theo đường cong và hạ êm vào vị trí đọc. Vé hiện rõ hình máy bay và đường bay cong cùng đích đến “Graduation Day”. Người xem sau đó có thể mở trang chi tiết.

## Cấu trúc triển khai được đề xuất

**Phương án đề xuất: Three.js dựng sân khấu và vật thể cảnh báo, HTML giữ nội dung.** Một scene Three.js tạo mưa dữ liệu nhiều lớp, khung cảnh tối, phần thân 3D của bảng cảnh báo, máy bay và khói. Lớp DOM nằm thẳng hàng với mặt bảng để giữ chữ thật, sắc nét, dễ truy cập; vé, lời mời, nút và RSVP tiếp tục là HTML/SVG. Một timeline điều khiển scene, hoạt cảnh rơi của vé và pose của mascot để nhịp đập, cú nắm, cú kéo, máy bay cất lên và vé hạ cánh ăn khớp.

Phương án này theo yêu cầu Three.js nhưng vẫn giữ nội dung chính dễ đọc và nhẹ hơn trên thiết bị di động.

### Phương án đã cân nhắc

1. **Sân khấu Three.js + giao diện HTML (đề xuất):** có chiều sâu và ánh sáng 3D ở đúng đoạn cần điện ảnh; chữ, nút, ticket và RSVP vẫn sắc nét. Rủi ro chính là đồng bộ góc nhìn của bảng 3D với lớp chữ HTML.
2. **Toàn bộ giao diện trong Three.js:** tạo cảm giác nhập vai nhất, nhưng chữ thành texture, khó chọn/copy và khó giữ đọc tốt khi màn hình hẹp.
3. **Giữ giao diện HTML và chỉ thêm CSS/canvas:** nhẹ nhất, nhưng không đáp ứng yêu cầu dùng Three.js để tăng chiều sâu.

**Lựa chọn triển khai:** phương án 1 đã được người dùng duyệt. Triển khai trực tiếp bằng Vite, JavaScript thuần và Three.js.

## Bố cục và đáp ứng màn hình

- Màn mở đầu giữ câu “Bạn có một tin nhắn bí mật.” và nút bắt đầu ở vùng trung tâm, trên nền tối sâu và tín hiệu đang được khóa.
- Cảnh hack dùng toàn viewport; bảng cảnh báo chiếm trung tâm. Nhãn trạng thái nhỏ ở góc, không cạnh tranh với tiêu đề.
- Điện thoại giảm số lớp, độ phân giải render và biên độ dolly/nghiêng phối cảnh; telemetry lùi khỏi vùng chữ chính; mascot và nút không che vé mời.
- Vé mời và trang chi tiết dùng DOM HTML, giữ nội dung đầy đủ và có thể chọn.
- `prefers-reduced-motion` cho cảnh tĩnh có trạng thái cảnh báo và đường vào vé mời rõ ràng.

## Kỹ thuật và đánh đổi

- Dùng Vite và một dependency Three.js; không dùng framework UI hay engine vật lý.
- Dùng một `WebGLRenderer` và `PerspectiveCamera`, giới hạn pixel ratio, giảm số phần tử 3D và biên độ chuyển động camera trên điện thoại. Dùng `renderer.setAnimationLoop()` để scene chạy liên tục; dừng khi tab bị ẩn hoặc khi hệ thống yêu cầu giảm chuyển động.
- Mưa dữ liệu và đèn cảnh báo được tạo bằng geometry/material trong scene; nội dung cần đọc không nằm trong canvas.
- Máy bay dựng từ geometry nhẹ; khói dùng geometry hạt trong suốt và `CanvasTexture`. Nội dung vé cùng biểu tượng máy bay trên vé vẫn là HTML/SVG sắc nét.
- Timeline dùng các trạng thái có thể reset, skip và replay; tránh tạo timer mới không được hủy khi chạy lại.
- Tài liệu Three.js hiện hành có `setPixelRatio()` và `setAnimationLoop()` trên `WebGLRenderer`, phù hợp với giới hạn render và một vòng lặp cảnh duy nhất: [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html). `CanvasTexture` có thể dùng cho chi tiết trang trí cần kết cấu, không dùng cho nội dung lời mời: [CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html).

## Phạm vi ngoài

- Không triển khai xử lý RSVP thật hoặc lưu dữ liệu.
- Không thêm cấu hình sự kiện chưa được cung cấp.
- Không xây mascot 3D mới; dùng mascot hiện có và cải thiện pose/cú kéo.
- Không triển khai xuất bản/deploy trong bước này.

## Duyệt thiết kế

Người dùng đã duyệt hướng cyber-cinematic 3D, stack Vite + JavaScript thuần + Three.js và yêu cầu dựng trực tiếp bằng code.
