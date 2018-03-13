#include "xz.h"

#include <stdarg.h>
#include <errno.h>
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>

struct session
{
    struct xz_dec* dec;
    struct xz_buf buffers;
};

static int crc_initialized = 0;

extern void init()
{
    if (!crc_initialized)
    {
        xz_crc32_init();
        xz_crc64_init();
        crc_initialized = 1;
    }
}

extern struct session* init_decompression(size_t buffer_size)
{
    init();
    struct session* s = malloc(sizeof(struct session));
    s->dec = xz_dec_init(XZ_DYNALLOC, 1024 * 1024 * 100);
    s->buffers.in = malloc(buffer_size);
    s->buffers.in_pos = 0;
    s->buffers.in_size = 0;
    s->buffers.out = malloc(buffer_size);
    s->buffers.out_pos = 0;
    s->buffers.out_size = buffer_size;

    return s;
}

extern int input_empty(struct session* s)
{
    return s->buffers.in_pos >= s->buffers.in_size;
}

extern int get_in_buffer(struct session* s)
{
    return (int) s->buffers.in;
}

extern void set_new_input(struct session* s, size_t length)
{
    s->buffers.in_pos = 0;
    s->buffers.in_size = length;
}

extern int decompress(struct session* s)
{
    return xz_dec_run(s->dec, &(s->buffers));
}

extern int get_out_pos(struct session* s)
{
    return s->buffers.out_pos;
}

extern int get_out_buffer(struct session* s)
{
    return (int) s->buffers.out;
}

extern void out_buffer_cleared(struct session* s)
{
    s->buffers.out_pos = 0;
}

extern void release(struct session* s)
{
    xz_dec_end(s->dec);
    free((uint8_t*)s->buffers.in);
    free(s->buffers.out);
    free(s);
}
